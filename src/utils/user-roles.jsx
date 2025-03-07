import { Truck, ShoppingCart } from "lucide-react"

export const roles = [
    {
        id: 'buyer',
        title: 'Buyer',
        description: 'I want to purchase goods or services from suppliers.',
        icon: ShoppingCart,
        color: 'bg-blue-500',
        benefits: [
            'Access to products and services',
            'Competitive pricing from multiple suppliers',
            'Streamlined procurement process',
        ],
    },
    {
        id: 'supplier',
        title: 'Supplier',
        description: 'I want to offer my goods or services to potential buyers.',
        icon: Truck,
        color: 'bg-green-500',
        benefits: [
            'Reach a larger customer base',
            'Showcase your products or services',
            'Efficient order management system',
        ],
    },
]