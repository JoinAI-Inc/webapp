import AdminLayout from '../components/AdminLayout'
import 'antd/dist/reset.css'

export const metadata = {
    title: 'Admin Portal',
    description: 'Administration portal for managing applications and users',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AdminLayout>{children}</AdminLayout>
            </body>
        </html>
    )
}
