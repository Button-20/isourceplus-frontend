

export const supplierPlans = [
    {
        id: 'supplier-bronze',
        name: "Bronze",
        price: 15,
        description: "Access business opportunities from platinum buyers",
        users: 1,
        color: "bg-amber-600",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: false },
            { name: "Reports", included: false },
            { name: "Two-way Authentication", included: false },
            { name: "12-month Support", included: false },
        ]
    },
    {
        id: 'supplier-silver',
        name: "Silver",
        price: 20,
        description: "Access business opportunities from gold & platinum buyers",
        users: 2,
        color: "bg-gray-400",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: false },
            { name: "12-month Support", included: false },
        ]
    },
    {
        id: 'supplier-diamond',
        name: "Diamond",
        price: 25,
        description: "Access business opportunities from diamond, gold & platinum buyers",
        users: 3,
        color: "bg-sky-500",
        popular: true,
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: true },
            { name: "12-month Support", included: false },
        ]
    },
    {
        id: 'supplier-gold',
        name: "Gold",
        price: 30,
        description: "Access business opportunities from silver, diamond, gold & platinum buyers",
        users: 4,
        color: "bg-yellow-500",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: true },
            { name: "12-month Support", included: true },
        ]
    },
    {
        id: 'supplier-platinum',
        name: "Platinum",
        price: 35,
        description: "Access business opportunities from all buyer tiers",
        users: 5,
        color: "bg-gray-800",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: true },
            { name: "12-month Support", included: true },
        ]
    },
]

export const buyerPlans = [
    {
        id: 'buyer-bronze',
        name: "Bronze",
        price: 10,
        description: "Connect to suppliers with Platinum package",
        users: 1,
        color: "bg-amber-600",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: false },
            { name: "Reports", included: false },
            { name: "Two-way Authentication", included: false },
            { name: "12-month Support", included: false },
        ]
    },
    {
        id: 'buyer-silver',
        name: "Silver",
        price: 15,
        description: "Connect to suppliers with Gold & Platinum packages",
        users: 2,
        color: "bg-gray-400",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: false },
            { name: "12-month Support", included: false },
        ]
    },
    {
        id: 'buyer-diamond',
        name: "Diamond",
        price: 20,
        description: "Connect to suppliers with Diamond, Gold & Platinum packages",
        users: 3,
        color: "bg-sky-500",
        popular: true,
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: true },
            { name: "12-month Support", included: false },
        ]
    },
    {
        id: 'buyer-gold',
        name: "Gold",
        price: 25,
        description: "Connect to suppliers with Silver, Diamond, Gold & Platinum packages",
        users: 4,
        color: "bg-yellow-500",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: true },
            { name: "12-month Support", included: true },
        ]
    },
    {
        id: 'buyer-platinum',
        name: "Platinum",
        price: 30,
        description: "Connect to suppliers with all package tiers",
        users: 5,
        color: "bg-gray-800",
        planCode: "11111111",
        features: [
            { name: "SMS (0.30/sms)", included: true },
            { name: "User Add-on (1 = GHC 10)", included: true },
            { name: "Managing User Permissions", included: true },
            { name: "Reports", included: true },
            { name: "Two-way Authentication", included: true },
            { name: "12-month Support", included: true },
        ]
    },
]