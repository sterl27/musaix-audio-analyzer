/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  },
  images: {
    domains: ['localhost', 'your-project.supabase.co']
  },
  webpack: (config) => {
    config.externals.push({
      'canvas': 'canvas'
    })
    return config
  }
}

module.exports = nextConfig