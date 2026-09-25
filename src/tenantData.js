const DEFAULT_TENANT_ID = 'arhatest'
const tenantDataLoaders = import.meta.glob('../config/*/data.json', {
  eager: false,
  import: 'default',
})

const getTenantId = () => {
  const configuredTenant = import.meta.env.VITE_TENANT_ID?.trim().toLowerCase()
  return configuredTenant || DEFAULT_TENANT_ID
}

const DEFAULT_THEME = {
  buttonColors: ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'],
  backgroundColor: '#ffffff',
  textColor: '#023e62',
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 16,
  sectionSpacing: 30,
  textSpacing: 15,
  btnSpacing: 15,
  backgroundImage: '',
}

const CUSTOM_SECTION_DEFAULTS = {
  socialLinks: 'Social Links',
  workLinks: 'Work Links',
  publications: 'Publications',
}

export const normalizeTenantData = (source) => {
  const data = JSON.parse(JSON.stringify(source))
  data.theme = { ...DEFAULT_THEME, ...(data.theme || {}) }

  Object.entries(CUSTOM_SECTION_DEFAULTS).forEach(([key, title]) => {
    if (Array.isArray(data[key])) {
      data[key] = { title, links: data[key] }
    } else if (data[key] && Array.isArray(data[key].links)) {
      data[key] = { title: data[key].title || title, ...data[key] }
    }
  })

  if (Array.isArray(data.connectLinks)) {
    data.connectLinks = { title: '', links: data.connectLinks }
  } else if (data.connectLinks && Array.isArray(data.connectLinks.links)) {
    data.connectLinks = { title: '', ...data.connectLinks }
  }

  Object.values(data.pages || {}).forEach((page) => {
    Object.entries(CUSTOM_SECTION_DEFAULTS).forEach(([key, title]) => {
      if (Array.isArray(page[key])) {
        page[key] = { title, links: page[key] }
      }
    })
    if (Array.isArray(page.connectLinks)) {
      page.connectLinks = { title: '', links: page.connectLinks }
    }
  })

  return data
}

export const loadTenantData = async () => {
  const tenantId = getTenantId()
  const selectedPath = `../config/${tenantId}/data.json`
  const fallbackPath = `../config/${DEFAULT_TENANT_ID}/data.json`
  const loadData = tenantDataLoaders[selectedPath] || tenantDataLoaders[fallbackPath]

  if (!loadData) {
    throw new Error('No tenant configuration is available.')
  }

  return loadData().then(normalizeTenantData)
}