import fs from 'fs';
import path from 'path';

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { password, data, message } = JSON.parse(event.body);
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (password !== correctPassword) {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: 'Unauthorized' })
            };
        }

        const commitMessage = message || "Update site data via Admin Panel";

        // Resolve GitHub variables (support both naming conventions)
        const owner = process.env.GITHUB_OWNER || process.env.REPO_OWNER;
        const repo = process.env.GITHUB_NAME || process.env.REPO_NAME;

        // Check if running in production with GitHub credentials
        if (process.env.GITHUB_TOKEN && owner && repo) {
            return await saveToGitHub(data, commitMessage, owner, repo);
        } else {
            // If on Netlify (production) but missing credentials, warn the user
            if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
                 const missing = [];
                 if (!process.env.GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
                 if (!owner) missing.push('REPO_OWNER');
                 if (!repo) missing.push('REPO_NAME');
                 
                 return {
                    statusCode: 500,
                    body: JSON.stringify({ 
                        success: false, 
                        message: `Missing GitHub Environment Variables: ${missing.join(', ')}. Please configure them in Netlify Site Settings.` 
                    })
                };
            }
            return saveLocally(data);
        }

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};

function saveLocally(data) {
    try {
        const tenantId = getTenantId();
        const dataPath = path.resolve(__dirname, `../../config/${tenantId}/data.json`);
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), 'utf8');

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Data saved locally!' })
        };
    } catch (err) {
        throw new Error(`Local save failed: ${err.message}`);
    }
}

async function saveToGitHub(data, commitMessage, owner, repo) {
    const token = process.env.GITHUB_TOKEN;
    const branch = 'main';

    const tenantId = getTenantId();
    
    const files = [
        {
            path: `config/${tenantId}/data.json`,
            content: JSON.stringify(data, null, 4)
        }
    ];

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function-Save-Data'
    };

    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    // 1. Get latest commit SHA of the branch
    const refRes = await fetch(`${baseUrl}/git/ref/heads/${branch}`, { headers });
    if (!refRes.ok) {
        const err = await refRes.text();
        throw new Error(`Failed to get branch ref: ${refRes.status} ${err}`);
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 2. Get the tree SHA of the latest commit
    const commitRes = await fetch(`${baseUrl}/git/commits/${latestCommitSha}`, { headers });
    if (!commitRes.ok) {
        const err = await commitRes.text();
        throw new Error(`Failed to get commit: ${commitRes.status} ${err}`);
    }
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Create a new tree
    const treePayload = {
        base_tree: baseTreeSha,
        tree: files.map(f => ({
            path: f.path,
            mode: '100644',
            type: 'blob',
            content: f.content
        }))
    };

    const treeRes = await fetch(`${baseUrl}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify(treePayload)
    });
    if (!treeRes.ok) {
        const err = await treeRes.text();
        throw new Error(`Failed to create tree: ${treeRes.status} ${err}`);
    }
    const treeData = await treeRes.json();
    const newTreeSha = treeData.sha;

    // 4. Create a new commit
    const commitPayload = {
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha]
    };

    const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commitPayload)
    });
    if (!newCommitRes.ok) {
        const err = await newCommitRes.text();
        throw new Error(`Failed to create commit: ${newCommitRes.status} ${err}`);
    }
    const newCommitData = await newCommitRes.json();
    const newCommitSha = newCommitData.sha;

    // 5. Update the branch reference
    const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sha: newCommitSha })
    });
    if (!updateRefRes.ok) {
        const err = await updateRefRes.text();
        throw new Error(`Failed to update ref: ${updateRefRes.status} ${err}`);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Data saved to GitHub and deployment triggered!' })
    };
}

function getTenantId() {
    const tenantId = (process.env.VITE_TENANT_ID || 'arhatest').trim().toLowerCase();
    return /^[a-z0-9_-]+$/.test(tenantId) ? tenantId : 'arhatest';
}
