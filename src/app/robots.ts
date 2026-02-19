import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/settings/', '/admin/'],
        },
        sitemap: 'https://krishnaconnect.in/sitemap.xml',
    }
}
