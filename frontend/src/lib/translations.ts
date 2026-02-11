'use client';

// Centralized translations for OTOHUB Dashboard
// Supports: id (Indonesian), en (English), th (Thai), ph (Filipino), vi (Vietnamese)

export type Language = 'id' | 'en' | 'th' | 'ph' | 'vi';

export interface TranslationKeys {
    // Sidebar
    menu: string;
    otherMenu: string;
    dashboard: string;
    listing: string;
    calendar: string;
    deals: string;
    tracking: string;
    activeBids: string;
    statistics: string;
    transaction: string;
    credit: string;
    customer: string;
    masterData: string;
    reports: string;
    staff: string;
    branch: string;
    stockTransfer: string;
    billing: string;
    activity: string;
    dealerGroup: string;
    search: string;
    settings: string;
    helpCenter: string;
    logout: string;

    // Header
    searchPlaceholder: string;
    notifications: string;

    // Dashboard Page
    vehicleListing: string;
    latestUpdate: string;
    filterBy: string;
    export: string;
    fixedPrice: string;
    callForPrice: string;

    // Stats Page
    statsTitle: string;
    totalVehicles: string;
    totalSales: string;
    revenue: string;
    pendingDeals: string;
    monthlySales: string;
    vehicleTypes: string;

    // Inventory Page
    inventoryTitle: string;
    addVehicle: string;
    editVehicle: string;
    deleteVehicle: string;
    vehicleName: string;
    brand: string;
    model: string;
    year: string;
    price: string;
    status: string;
    actions: string;
    available: string;
    sold: string;
    reserved: string;

    // Vehicle Condition
    ready: string;
    repair: string;
    condition: string;

    // Credit
    creditSimulation: string;
    tenor: string;
    downPayment: string;
    monthlyPayment: string;
    interestRate: string;

    // Common
    save: string;
    cancel: string;
    confirm: string;
    loading: string;
    noData: string;

    // Auth Page
    authUserEmail: string;
    authPassword: string;
    authFullName: string;
    authEmailActive: string;
    authCreatePass: string;
    authEmailReg: string;
    authErrRequired: string;
    authBtnLogin: string;
    authBtnSignup: string;
    authBtnReset: string;
    authBtnCancel: string;
    authForgotPass: string;
    authForgotDesc: string;
    authNoAccount: string;
    authHaveAccount: string;
    authLinkSignup: string;
    authLinkLogin: string;
    authAlertLogin: string;
    authAlertSignup: string;
    authAlertForgot: string;
    authErrLoginFailed: string;
    authErrSignupFailed: string;
    authRememberMe: string;

    // Settings Page
    settingsTitle: string;
    companyProfile: string;
    companyProfileDesc: string;
    dealerName: string;
    fullAddress: string;
    phoneNumber: string;
    businessEmail: string;
    accountInfo: string;
    planTier: string;
    changePassword: string;
    changePasswordDesc: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    notificationPrefs: string;
    notificationPrefsDesc: string;
    emailReminders: string;
    emailRemindersDesc: string;
    paymentAlerts: string;
    paymentAlertsDesc: string;
    systemUpdates: string;
    systemUpdatesDesc: string;
    marketingEmails: string;
    marketingEmailsDesc: string;
    saveChanges: string;
    saveSettings: string;
    currencyPreference: string;

    // Transactions Page
    transactionTitle: string;
    transactionDesc: string;
    newTransaction: string;
    saleType: string;
    purchaseType: string;
    paymentMethod: string;
    cash: string;
    totalAmount: string;
    invoice: string;
    selectVehicle: string;
    selectCustomer: string;
    transactionDate: string;
    notes: string;

    // Reports Page
    reportsTitle: string;
    reportsDesc: string;
    soldThisMonth: string;
    revenueThisMonth: string;
    fromLastMonth: string;
    newThisMonth: string;
    monthlySalesChart: string;
    unitsSoldAndRevenue: string;
    topBrands: string;
    revenueByCategory: string;
    performanceTitle: string;
    avgStockDays: string;
    avgMargin: string;
    conversionRate: string;
    totalSoldPeriod: string;
    noSalesData: string;
    monthLabel: string;
    yearLabel: string;
    unit: string;
    days: string;
    exportVehicles: string;
    exportCustomers: string;
    exportTransactions: string;
    exportSuccess: string;
    exportFailed: string;

    // Calendar Page
    calendarTitle: string;
    today: string;
    upcomingPayments: string;
    installment: string;

    // Master Data Page
    masterTitle: string;
    masterDesc: string;
    addBrand: string;
    addModel: string;
    brandName: string;
    modelName: string;
    variants: string;
    editBrand: string;
    deleteBrand: string;
    manageCategories: string;

    // Staff Page
    staffTitle: string;
    staffDesc: string;
    addStaff: string;
    editStaff: string;
    deleteStaff: string;
    fullAccess: string;
    limitedAccess: string;
    role: string;
    joined: string;
    contact: string;
    password: string;
    minChars: string;
    searchNameEmail: string;
    noStaffFound: string;
    deleteStaffConfirm: string;
    deleteStaffWarning: string;
    yesDelete: string;

    // Branches Page
    branchTitle: string;
    addBranch: string;
    branchName: string;
    branchAddress: string;
    branchPhone: string;

    // Billing Page
    billingTitle: string;
    currentPlan: string;
    invoiceHistory: string;
    payNow: string;

    // Activity Page
    activityTitle: string;
    recentActivity: string;
    activityLog: string;

    // Common (extended)
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    all: string;
    pending: string;
    paid: string;
    cancelled: string;
    completed: string;
    failed: string;
    success: string;
    error: string;
    warning: string;
    requiredFields: string;
}

const translations: Record<Language, TranslationKeys> = {
    id: {
        // Sidebar
        menu: 'Menu',
        otherMenu: 'Menu Lainnya',
        dashboard: 'Dashboard',
        listing: 'Inventaris',
        calendar: 'Kalender',
        deals: 'Penawaran',
        tracking: 'Pelacakan',
        activeBids: 'Penawaran Aktif',
        statistics: 'Statistik',
        transaction: 'Transaksi',
        credit: 'Kredit',
        customer: 'Customer',
        masterData: 'Master Data',
        reports: 'Laporan',
        staff: 'Tim Sales',
        branch: 'Cabang',
        stockTransfer: 'Transfer Stok',
        billing: 'Tagihan',
        activity: 'Aktivitas',
        dealerGroup: 'Dealer Group',
        search: 'Pencarian',
        settings: 'Pengaturan',
        helpCenter: 'Pusat Bantuan',
        logout: 'Keluar',

        // Header
        searchPlaceholder: 'Ketik untuk mencari...',
        notifications: 'Notifikasi',

        // Dashboard Page
        vehicleListing: 'Daftar Kendaraan',
        latestUpdate: 'Update terbaru 7 hari terakhir',
        filterBy: 'Filter',
        export: 'Ekspor',
        fixedPrice: 'Harga Tetap',
        callForPrice: 'Hubungi untuk Harga',

        // Stats Page
        statsTitle: 'Statistik Bisnis',
        totalVehicles: 'Total Kendaraan',
        totalSales: 'Total Penjualan',
        revenue: 'Pendapatan',
        pendingDeals: 'Penawaran Tertunda',
        monthlySales: 'Penjualan Bulanan',
        vehicleTypes: 'Jenis Kendaraan',

        // Inventory Page
        inventoryTitle: 'Manajemen Inventaris',
        addVehicle: 'Tambah Kendaraan',
        editVehicle: 'Edit Kendaraan',
        deleteVehicle: 'Hapus Kendaraan',
        vehicleName: 'Nama Kendaraan',
        brand: 'Merek',
        model: 'Model',
        year: 'Tahun',
        price: 'Harga',
        status: 'Status',
        actions: 'Aksi',
        available: 'Tersedia',
        sold: 'Terjual',
        reserved: 'Dipesan',

        // Vehicle Condition
        ready: 'Siap Jual',
        repair: 'Dalam Perbaikan',
        condition: 'Kondisi',

        // Credit
        creditSimulation: 'Simulasi Angsuran',
        tenor: 'Tenor',
        downPayment: 'Uang Muka (DP)',
        monthlyPayment: 'Cicilan/Bulan',
        interestRate: 'Bunga (%)',

        // Common
        save: 'Simpan',
        cancel: 'Batal',
        confirm: 'Konfirmasi',
        loading: 'Memuat...',
        noData: 'Tidak ada data',

        // Auth Page
        authUserEmail: 'Username / Email',
        authPassword: 'Password',
        authFullName: 'Nama Lengkap',
        authEmailActive: 'Email Aktif',
        authCreatePass: 'Buat Password',
        authEmailReg: 'Email Terdaftar',
        authErrRequired: 'Mohon isi bidang ini',
        authBtnLogin: 'MASUK',
        authBtnSignup: 'DAFTAR AKUN',
        authBtnReset: 'KIRIM RESET LINK',
        authBtnCancel: 'BATAL',
        authForgotPass: 'Lupa Password?',
        authForgotDesc: 'Masukkan email Anda, kami akan mengirimkan link untuk mereset password.',
        authNoAccount: 'Belum punya akun?',
        authHaveAccount: 'Sudah punya akun?',
        authLinkSignup: 'Daftar Sekarang',
        authLinkLogin: 'Login Disini',
        authAlertLogin: 'Sedang memproses Login...',
        authAlertSignup: 'Akun berhasil dibuat!',
        authAlertForgot: 'Link reset terkirim!',
        authErrLoginFailed: 'Login gagal. Cek kredensial Anda.',
        authErrSignupFailed: 'Gagal mendaftar. Email mungkin sudah dipakai.',
        authRememberMe: 'Ingat Saya',
        // Settings
        settingsTitle: 'Pengaturan',
        companyProfile: 'Profil Perusahaan',
        companyProfileDesc: 'Informasi ini akan tampil di kop invoice',
        dealerName: 'Nama Dealer / Perusahaan',
        fullAddress: 'Alamat Lengkap',
        phoneNumber: 'Nomor Telepon',
        businessEmail: 'Email Bisnis',
        accountInfo: 'Informasi Akun',
        planTier: 'Paket',
        changePassword: 'Ubah Password',
        changePasswordDesc: 'Pastikan password baru minimal 6 karakter',
        currentPassword: 'Password Saat Ini',
        newPassword: 'Password Baru',
        confirmNewPassword: 'Konfirmasi Password Baru',
        notificationPrefs: 'Preferensi Notifikasi',
        notificationPrefsDesc: 'Atur notifikasi yang ingin Anda terima',
        emailReminders: 'Pengingat Email',
        emailRemindersDesc: 'Terima pengingat pembayaran dan jatuh tempo',
        paymentAlerts: 'Alert Pembayaran',
        paymentAlertsDesc: 'Notifikasi saat ada pembayaran masuk atau tagihan baru',
        systemUpdates: 'Update Sistem',
        systemUpdatesDesc: 'Informasi fitur baru dan maintenance',
        marketingEmails: 'Email Marketing',
        marketingEmailsDesc: 'Promo dan penawaran khusus',
        saveChanges: 'Simpan Perubahan',
        saveSettings: 'Simpan Pengaturan',
        currencyPreference: 'Mata Uang',
        // Transactions
        transactionTitle: 'Transaksi',
        transactionDesc: 'Kelola penjualan dan pembelian kendaraan',
        newTransaction: 'Transaksi Baru',
        saleType: 'Penjualan',
        purchaseType: 'Pembelian',
        paymentMethod: 'Metode Pembayaran',
        cash: 'Tunai',
        totalAmount: 'Total Harga',
        invoice: 'Invoice',
        selectVehicle: 'Pilih Kendaraan',
        selectCustomer: 'Pilih Pelanggan',
        transactionDate: 'Tanggal Transaksi',
        notes: 'Catatan',
        // Reports
        reportsTitle: 'Laporan & Statistik',
        reportsDesc: 'Pantau performa bisnis Anda secara real-time',
        soldThisMonth: 'Terjual Bulan Ini',
        revenueThisMonth: 'Revenue Bulan Ini',
        fromLastMonth: 'dari bulan lalu',
        newThisMonth: 'baru bulan ini',
        monthlySalesChart: 'Penjualan Bulanan',
        unitsSoldAndRevenue: 'Unit terjual dan pendapatan',
        topBrands: 'Merek Terlaris',
        revenueByCategory: 'Revenue per Kategori',
        performanceTitle: 'Performa',
        avgStockDays: 'Avg. Lama Stok',
        avgMargin: 'Margin Rata-rata',
        conversionRate: 'Tingkat Konversi',
        totalSoldPeriod: 'Total Terjual',
        noSalesData: 'Belum ada data penjualan',
        monthLabel: 'Bulan',
        yearLabel: 'Tahun',
        unit: 'unit',
        days: 'hari',
        exportVehicles: 'Kendaraan (CSV)',
        exportCustomers: 'Pelanggan (CSV)',
        exportTransactions: 'Transaksi (CSV)',
        exportSuccess: 'Data berhasil diexport',
        exportFailed: 'Gagal mengekspor data. Silakan coba lagi.',
        // Calendar
        calendarTitle: 'Kalender',
        today: 'Hari Ini',
        upcomingPayments: 'Pembayaran Mendatang',
        installment: 'Cicilan',
        // Master Data
        masterTitle: 'Master Data',
        masterDesc: 'Kelola merek, model, dan kategori kendaraan',
        addBrand: 'Tambah Merek',
        addModel: 'Tambah Model',
        brandName: 'Nama Merek',
        modelName: 'Nama Model',
        variants: 'Varian',
        editBrand: 'Edit Merek',
        deleteBrand: 'Hapus Merek',
        manageCategories: 'Kelola Kategori',
        // Staff
        staffTitle: 'Manajemen Staff',
        staffDesc: 'Kelola tim sales dan akses pengguna',
        addStaff: 'Tambah Staff',
        editStaff: 'Edit Staff',
        deleteStaff: 'Hapus Staff',
        fullAccess: 'Akses penuh',
        limitedAccess: 'Akses terbatas',
        role: 'Role',
        joined: 'Bergabung',
        contact: 'Kontak',
        password: 'Password',
        minChars: 'Minimal 6 karakter',
        searchNameEmail: 'Cari nama atau email...',
        noStaffFound: 'Tidak ada staff ditemukan',
        deleteStaffConfirm: 'Hapus Staff?',
        deleteStaffWarning: 'Apakah Anda yakin ingin menghapus staff ini? Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, Hapus',
        // Branches
        branchTitle: 'Cabang',
        addBranch: 'Tambah Cabang',
        branchName: 'Nama Cabang',
        branchAddress: 'Alamat Cabang',
        branchPhone: 'Telepon Cabang',
        // Billing
        billingTitle: 'Billing',
        currentPlan: 'Paket Saat Ini',
        invoiceHistory: 'Riwayat Invoice',
        payNow: 'Bayar Sekarang',
        // Activity
        activityTitle: 'Aktivitas',
        recentActivity: 'Aktivitas Terbaru',
        activityLog: 'Log Aktivitas',
        // Common
        delete: 'Hapus',
        edit: 'Edit',
        close: 'Tutup',
        back: 'Kembali',
        next: 'Selanjutnya',
        previous: 'Sebelumnya',
        all: 'Semua',
        pending: 'Menunggu',
        paid: 'Lunas',
        cancelled: 'Dibatalkan',
        completed: 'Selesai',
        failed: 'Gagal',
        success: 'Berhasil',
        error: 'Kesalahan',
        warning: 'Peringatan',
        requiredFields: 'Mohon lengkapi semua field yang wajib',
    },
    en: {
        // Sidebar
        menu: 'Menu',
        otherMenu: 'Other Menu',
        dashboard: 'Dashboard',
        listing: 'Inventory',
        calendar: 'Calendar',
        deals: 'Deals',
        tracking: 'Tracking',
        activeBids: 'Active Bids',
        statistics: 'Statistics',
        transaction: 'Transaction',
        credit: 'Credit',
        customer: 'Customer',
        masterData: 'Master Data',
        reports: 'Reports',
        staff: 'Sales Team',
        branch: 'Branch',
        stockTransfer: 'Stock Transfer',
        billing: 'Billing',
        activity: 'Activity',
        dealerGroup: 'Dealer Group',
        search: 'Search',
        settings: 'Settings',
        helpCenter: 'Help Center',
        logout: 'Log Out',

        // Header
        searchPlaceholder: 'Type here to search...',
        notifications: 'Notifications',

        // Dashboard Page
        vehicleListing: 'Vehicle Listing',
        latestUpdate: 'Latest update for the last 7 days',
        filterBy: 'Filter By',
        export: 'Export',
        fixedPrice: 'Fixed Price',
        callForPrice: 'Call for Price',

        // Stats Page
        statsTitle: 'Business Statistics',
        totalVehicles: 'Total Vehicles',
        totalSales: 'Total Sales',
        revenue: 'Revenue',
        pendingDeals: 'Pending Deals',
        monthlySales: 'Monthly Sales',
        vehicleTypes: 'Vehicle Types',

        // Inventory Page
        inventoryTitle: 'Inventory Management',
        addVehicle: 'Add Vehicle',
        editVehicle: 'Edit Vehicle',
        deleteVehicle: 'Delete Vehicle',
        vehicleName: 'Vehicle Name',
        brand: 'Brand',
        model: 'Model',
        year: 'Year',
        price: 'Price',
        status: 'Status',
        actions: 'Actions',
        available: 'Available',
        sold: 'Sold',
        reserved: 'Reserved',

        // Vehicle Condition
        ready: 'Ready',
        repair: 'Under Repair',
        condition: 'Condition',

        // Credit
        creditSimulation: 'Credit Simulation',
        tenor: 'Tenor',
        downPayment: 'Down Payment',
        monthlyPayment: 'Monthly Payment',
        interestRate: 'Interest Rate (%)',

        // Common
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        loading: 'Loading...',
        noData: 'No data available',

        // Auth Page
        authUserEmail: 'Username / Email',
        authPassword: 'Password',
        authFullName: 'Full Name',
        authEmailActive: 'Active Email',
        authCreatePass: 'Create Password',
        authEmailReg: 'Registered Email',
        authErrRequired: 'Please fill out this field',
        authBtnLogin: 'LOGIN',
        authBtnSignup: 'SIGN UP',
        authBtnReset: 'SEND RESET LINK',
        authBtnCancel: 'CANCEL',
        authForgotPass: 'Forgot Password?',
        authForgotDesc: 'Enter your email, we will send a link to reset your password.',
        authNoAccount: "Don't have an account?",
        authHaveAccount: 'Already have an account?',
        authLinkSignup: 'Sign Up Now',
        authLinkLogin: 'Login Here',
        authAlertLogin: 'Processing Login...',
        authAlertSignup: 'Account created successfully!',
        authAlertForgot: 'Reset link sent!',
        authErrLoginFailed: 'Login failed. Check your credentials.',
        authErrSignupFailed: 'Signup failed. Email might be taken.',
        authRememberMe: 'Remember Me',
        settingsTitle: 'Settings',
        companyProfile: 'Company Profile',
        companyProfileDesc: 'This information will appear on invoice headers',
        dealerName: 'Dealer / Company Name',
        fullAddress: 'Full Address',
        phoneNumber: 'Phone Number',
        businessEmail: 'Business Email',
        accountInfo: 'Account Information',
        planTier: 'Plan',
        changePassword: 'Change Password',
        changePasswordDesc: 'Ensure new password is at least 6 characters',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        notificationPrefs: 'Notification Preferences',
        notificationPrefsDesc: 'Manage the notifications you receive',
        emailReminders: 'Email Reminders',
        emailRemindersDesc: 'Receive payment and due date reminders',
        paymentAlerts: 'Payment Alerts',
        paymentAlertsDesc: 'Notifications for incoming payments or new invoices',
        systemUpdates: 'System Updates',
        systemUpdatesDesc: 'New features and maintenance info',
        marketingEmails: 'Marketing Emails',
        marketingEmailsDesc: 'Promos and special offers',
        saveChanges: 'Save Changes',
        saveSettings: 'Save Settings',
        currencyPreference: 'Currency',
        transactionTitle: 'Transactions',
        transactionDesc: 'Manage vehicle sales and purchases',
        newTransaction: 'New Transaction',
        saleType: 'Sale',
        purchaseType: 'Purchase',
        paymentMethod: 'Payment Method',
        cash: 'Cash',
        totalAmount: 'Total Price',
        invoice: 'Invoice',
        selectVehicle: 'Select Vehicle',
        selectCustomer: 'Select Customer',
        transactionDate: 'Transaction Date',
        notes: 'Notes',
        reportsTitle: 'Reports & Statistics',
        reportsDesc: 'Monitor your business performance in real-time',
        soldThisMonth: 'Sold This Month',
        revenueThisMonth: 'Revenue This Month',
        fromLastMonth: 'from last month',
        newThisMonth: 'new this month',
        monthlySalesChart: 'Monthly Sales',
        unitsSoldAndRevenue: 'Units sold and revenue',
        topBrands: 'Top Brands',
        revenueByCategory: 'Revenue by Category',
        performanceTitle: 'Performance',
        avgStockDays: 'Avg. Stock Duration',
        avgMargin: 'Average Margin',
        conversionRate: 'Conversion Rate',
        totalSoldPeriod: 'Total Sold',
        noSalesData: 'No sales data yet',
        monthLabel: 'Month',
        yearLabel: 'Year',
        unit: 'unit',
        days: 'days',
        exportVehicles: 'Vehicles (CSV)',
        exportCustomers: 'Customers (CSV)',
        exportTransactions: 'Transactions (CSV)',
        exportSuccess: 'Data exported successfully',
        exportFailed: 'Failed to export data. Please try again.',
        calendarTitle: 'Calendar',
        today: 'Today',
        upcomingPayments: 'Upcoming Payments',
        installment: 'Installment',
        masterTitle: 'Master Data',
        masterDesc: 'Manage brands, models, and vehicle categories',
        addBrand: 'Add Brand',
        addModel: 'Add Model',
        brandName: 'Brand Name',
        modelName: 'Model Name',
        variants: 'Variants',
        editBrand: 'Edit Brand',
        deleteBrand: 'Delete Brand',
        manageCategories: 'Manage Categories',
        staffTitle: 'Staff Management',
        staffDesc: 'Manage sales team and user access',
        addStaff: 'Add Staff',
        editStaff: 'Edit Staff',
        deleteStaff: 'Delete Staff',
        fullAccess: 'Full access',
        limitedAccess: 'Limited access',
        role: 'Role',
        joined: 'Joined',
        contact: 'Contact',
        password: 'Password',
        minChars: 'Minimum 6 characters',
        searchNameEmail: 'Search name or email...',
        noStaffFound: 'No staff found',
        deleteStaffConfirm: 'Delete Staff?',
        deleteStaffWarning: 'Are you sure you want to delete this staff member? This action cannot be undone.',
        yesDelete: 'Yes, Delete',
        branchTitle: 'Branches',
        addBranch: 'Add Branch',
        branchName: 'Branch Name',
        branchAddress: 'Branch Address',
        branchPhone: 'Branch Phone',
        billingTitle: 'Billing',
        currentPlan: 'Current Plan',
        invoiceHistory: 'Invoice History',
        payNow: 'Pay Now',
        activityTitle: 'Activity',
        recentActivity: 'Recent Activity',
        activityLog: 'Activity Log',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        all: 'All',
        pending: 'Pending',
        paid: 'Paid',
        cancelled: 'Cancelled',
        completed: 'Completed',
        failed: 'Failed',
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        requiredFields: 'Please fill in all required fields',
    },
    th: {
        menu: 'เมนู',
        otherMenu: 'เมนูอื่น ๆ',
        dashboard: 'แดชบอร์ด',
        listing: 'รายการ',
        calendar: 'ปฏิทิน',
        deals: 'ดีล',
        tracking: 'การติดตาม',
        activeBids: 'การประมูล',
        statistics: 'สถิติ',
        transaction: 'ธุรกรรม',
        credit: 'สินเชื่อ',
        customer: 'ลูกค้า',
        masterData: 'ข้อมูลหลัก',
        reports: 'รายงาน',
        staff: 'ทีมขาย',
        branch: 'สาขา',
        stockTransfer: 'โอนย้ายสต็อก',
        billing: 'การเรียกเก็บเงิน',
        activity: 'กิจกรรม',
        dealerGroup: 'Dealer Group',
        search: 'ค้นหา',
        settings: 'ตั้งค่า',
        helpCenter: 'ศูนย์ช่วยเหลือ',
        logout: 'ออกจากระบบ',
        searchPlaceholder: 'พิมพ์เพื่อค้นหา...',
        notifications: 'การแจ้งเตือน',
        vehicleListing: 'รายการยานพาหนะ',
        latestUpdate: 'อัปเดตล่าสุด 7 วัน',
        filterBy: 'กรองตาม',
        export: 'ส่งออก',
        fixedPrice: 'ราคาคงที่',
        callForPrice: 'โทรสอบถามราคา',
        statsTitle: 'สถิติธุรกิจ',
        totalVehicles: 'ยานพาหนะทั้งหมด',
        totalSales: 'ยอดขายทั้งหมด',
        revenue: 'รายได้',
        pendingDeals: 'ดีลที่รอดำเนินการ',
        monthlySales: 'ยอดขายรายเดือน',
        vehicleTypes: 'ประเภทยานพาหนะ',
        inventoryTitle: 'การจัดการสินค้าคงคลัง',
        addVehicle: 'เพิ่มยานพาหนะ',
        editVehicle: 'แก้ไขยานพาหนะ',
        deleteVehicle: 'ลบยานพาหนะ',
        vehicleName: 'ชื่อยานพาหนะ',
        brand: 'ยี่ห้อ',
        model: 'รุ่น',
        year: 'ปี',
        price: 'ราคา',
        status: 'สถานะ',
        actions: 'การดำเนินการ',
        available: 'พร้อมจำหน่าย',
        sold: 'ขายแล้ว',
        reserved: 'จองแล้ว',
        ready: 'พร้อม',
        repair: 'ซ่อมแซม',
        condition: 'สภาพ',
        creditSimulation: 'จำลองสินเชื่อ',
        tenor: 'ระยะเวลา',
        downPayment: 'เงินดาวน์',
        monthlyPayment: 'ผ่อนรายเดือน',
        interestRate: 'อัตราดอกเบี้ย',
        save: 'บันทึก',
        cancel: 'ยกเลิก',
        confirm: 'ยืนยัน',
        loading: 'กำลังโหลด...',
        noData: 'ไม่มีข้อมูล',

        // Auth Page
        authUserEmail: 'ชื่อผู้ใช้ / อีเมล',
        authPassword: 'รหัสผ่าน',
        authFullName: 'ชื่อเต็ม',
        authEmailActive: 'อีเมลที่ใช้งานอยู่',
        authCreatePass: 'สร้างรหัสผ่าน',
        authEmailReg: 'อีเมลที่ลงทะเบียน',
        authErrRequired: 'กรุณากรอกข้อมูลในช่องนี้',
        authBtnLogin: 'เข้าสู่ระบบ',
        authBtnSignup: 'ลงชื่อ',
        authBtnReset: 'ส่งลิงก์รีเซ็ต',
        authBtnCancel: 'ยกเลิก',
        authForgotPass: 'ลืมรหัสผ่าน?',
        authForgotDesc: 'ใส่อีเมลของคุณ เราจะส่งลิงก์เพื่อรีเซ็ตรหัสผ่าน',
        authNoAccount: 'ยังไม่มีบัญชี?',
        authHaveAccount: 'มีบัญชีอยู่แล้ว?',
        authLinkSignup: 'ลงทะเบียนตอนนี้',
        authLinkLogin: 'เข้าสู่ระบบที่นี่',
        authAlertLogin: 'กำลังเข้าสู่ระบบ...',
        authAlertSignup: 'สร้างบัญชีสำเร็จ!',
        authAlertForgot: 'ส่งลิงก์รีเซ็ตแล้ว!',
        authErrLoginFailed: 'เข้าสู่ระบบล้มเหลว ตรวจสอบข้อมูลรับรองของคุณ',
        authErrSignupFailed: 'ลงทะเบียนล้มเหลว อีเมลอาจถูกใช้ไปแล้ว',
        authRememberMe: 'จดจำฉัน',
        settingsTitle: 'ตั้งค่า',
        companyProfile: 'โปรไฟล์บริษัท',
        companyProfileDesc: 'ข้อมูลนี้จะแสดงบนหัวใบแจ้งหนี้',
        dealerName: 'ชื่อตัวแทนจำหน่าย / บริษัท',
        fullAddress: 'ที่อยู่เต็ม',
        phoneNumber: 'หมายเลขโทรศัพท์',
        businessEmail: 'อีเมลธุรกิจ',
        accountInfo: 'ข้อมูลบัญชี',
        planTier: 'แพ็กเกจ',
        changePassword: 'เปลี่ยนรหัสผ่าน',
        changePasswordDesc: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร',
        currentPassword: 'รหัสผ่านปัจจุบัน',
        newPassword: 'รหัสผ่านใหม่',
        confirmNewPassword: 'ยืนยันรหัสผ่านใหม่',
        notificationPrefs: 'ตั้งค่าการแจ้งเตือน',
        notificationPrefsDesc: 'จัดการการแจ้งเตือนที่คุณต้องการรับ',
        emailReminders: 'การเตือนทางอีเมล',
        emailRemindersDesc: 'รับการเตือนการชำระเงินและวันครบกำหนด',
        paymentAlerts: 'แจ้งเตือนการชำระเงิน',
        paymentAlertsDesc: 'แจ้งเตือนเมื่อมีการชำระเงินเข้ามาหรือใบแจ้งหนี้ใหม่',
        systemUpdates: 'อัปเดตระบบ',
        systemUpdatesDesc: 'ข้อมูลฟีเจอร์ใหม่และการบำรุงรักษา',
        marketingEmails: 'อีเมลการตลาด',
        marketingEmailsDesc: 'โปรโมชั่นและข้อเสนอพิเศษ',
        saveChanges: 'บันทึกการเปลี่ยนแปลง',
        saveSettings: 'บันทึกการตั้งค่า',
        currencyPreference: 'สกุลเงิน',
        transactionTitle: 'ธุรกรรม',
        transactionDesc: 'จัดการการซื้อขายรถ',
        newTransaction: 'ธุรกรรมใหม่',
        saleType: 'การขาย',
        purchaseType: 'การซื้อ',
        paymentMethod: 'วิธีการชำระเงิน',
        cash: 'เงินสด',
        totalAmount: 'ราคารวม',
        invoice: 'ใบแจ้งหนี้',
        selectVehicle: 'เลือกรถ',
        selectCustomer: 'เลือกลูกค้า',
        transactionDate: 'วันที่ทำธุรกรรม',
        notes: 'หมายเหตุ',
        reportsTitle: 'รายงานและสถิติ',
        reportsDesc: 'ติดตามผลการดำเนินธุรกิจแบบเรียลไทม์',
        soldThisMonth: 'ขายในเดือนนี้',
        revenueThisMonth: 'รายได้เดือนนี้',
        fromLastMonth: 'จากเดือนที่แล้ว',
        newThisMonth: 'ใหม่เดือนนี้',
        monthlySalesChart: 'ยอดขายรายเดือน',
        unitsSoldAndRevenue: 'จำนวนที่ขายและรายได้',
        topBrands: 'แบรนด์ยอดนิยม',
        revenueByCategory: 'รายได้ตามหมวดหมู่',
        performanceTitle: 'ประสิทธิภาพ',
        avgStockDays: 'ระยะเวลาสต็อกเฉลี่ย',
        avgMargin: 'กำไรเฉลี่ย',
        conversionRate: 'อัตราการแปลง',
        totalSoldPeriod: 'ยอดขายรวม',
        noSalesData: 'ยังไม่มีข้อมูลการขาย',
        monthLabel: 'เดือน',
        yearLabel: 'ปี',
        unit: 'คัน',
        days: 'วัน',
        exportVehicles: 'รถ (CSV)',
        exportCustomers: 'ลูกค้า (CSV)',
        exportTransactions: 'ธุรกรรม (CSV)',
        exportSuccess: 'ส่งออกข้อมูลสำเร็จ',
        exportFailed: 'ส่งออกข้อมูลล้มเหลว กรุณาลองอีกครั้ง',
        calendarTitle: 'ปฏิทิน',
        today: 'วันนี้',
        upcomingPayments: 'การชำระเงินที่จะถึง',
        installment: 'ผ่อนชำระ',
        masterTitle: 'ข้อมูลหลัก',
        masterDesc: 'จัดการแบรนด์ รุ่น และหมวดหมู่รถ',
        addBrand: 'เพิ่มแบรนด์',
        addModel: 'เพิ่มรุ่น',
        brandName: 'ชื่อแบรนด์',
        modelName: 'ชื่อรุ่น',
        variants: 'รุ่นย่อย',
        editBrand: 'แก้ไขแบรนด์',
        deleteBrand: 'ลบแบรนด์',
        manageCategories: 'จัดการหมวดหมู่',
        staffTitle: 'จัดการพนักงาน',
        staffDesc: 'จัดการทีมขายและสิทธิ์ผู้ใช้',
        addStaff: 'เพิ่มพนักงาน',
        editStaff: 'แก้ไขพนักงาน',
        deleteStaff: 'ลบพนักงาน',
        fullAccess: 'สิทธิ์เต็ม',
        limitedAccess: 'สิทธิ์จำกัด',
        role: 'บทบาท',
        joined: 'เข้าร่วม',
        contact: 'ติดต่อ',
        password: 'รหัสผ่าน',
        minChars: 'อย่างน้อย 6 ตัวอักษร',
        searchNameEmail: 'ค้นหาชื่อหรืออีเมล...',
        noStaffFound: 'ไม่พบพนักงาน',
        deleteStaffConfirm: 'ลบพนักงาน?',
        deleteStaffWarning: 'คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
        yesDelete: 'ใช่ ลบเลย',
        branchTitle: 'สาขา',
        addBranch: 'เพิ่มสาขา',
        branchName: 'ชื่อสาขา',
        branchAddress: 'ที่อยู่สาขา',
        branchPhone: 'โทรศัพท์สาขา',
        billingTitle: 'การเรียกเก็บเงิน',
        currentPlan: 'แพ็กเกจปัจจุบัน',
        invoiceHistory: 'ประวัติใบแจ้งหนี้',
        payNow: 'ชำระตอนนี้',
        activityTitle: 'กิจกรรม',
        recentActivity: 'กิจกรรมล่าสุด',
        activityLog: 'ประวัติกิจกรรม',
        delete: 'ลบ',
        edit: 'แก้ไข',
        close: 'ปิด',
        back: 'กลับ',
        next: 'ถัดไป',
        previous: 'ก่อนหน้า',
        all: 'ทั้งหมด',
        pending: 'รอดำเนินการ',
        paid: 'ชำระแล้ว',
        cancelled: 'ยกเลิก',
        completed: 'เสร็จสิ้น',
        failed: 'ล้มเหลว',
        success: 'สำเร็จ',
        error: 'ข้อผิดพลาด',
        warning: 'คำเตือน',
        requiredFields: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ',
    },
    ph: {
        menu: 'Menu',
        otherMenu: 'Ibang Menu',
        dashboard: 'Dashboard',
        listing: 'Listahan',
        calendar: 'Kalendaryo',
        deals: 'Mga Deal',
        tracking: 'Pagsubaybay',
        activeBids: 'Aktibong Bid',
        statistics: 'Estadistika',
        transaction: 'Transaksyon',
        credit: 'Kredito',
        customer: 'Customer',
        masterData: 'Master Data',
        reports: 'Mga Ulat',
        staff: 'Sales Team',
        branch: 'Sangay',
        stockTransfer: 'Stock Transfer',
        billing: 'Billing',
        activity: 'Aktibidad',
        dealerGroup: 'Dealer Group',
        search: 'Maghanap',
        settings: 'Mga Setting',
        helpCenter: 'Sentro ng Tulong',
        logout: 'Mag-logout',
        searchPlaceholder: 'Mag-type upang maghanap...',
        notifications: 'Mga Notipikasyon',
        vehicleListing: 'Listahan ng Sasakyan',
        latestUpdate: 'Huling update sa 7 araw',
        filterBy: 'I-filter ayon sa',
        export: 'I-export',
        fixedPrice: 'Fixed na Presyo',
        callForPrice: 'Tumawag para sa Presyo',
        statsTitle: 'Estadistika ng Negosyo',
        totalVehicles: 'Kabuuang Sasakyan',
        totalSales: 'Kabuuang Benta',
        revenue: 'Kita',
        pendingDeals: 'Naghihintay na Deal',
        monthlySales: 'Buwanang Benta',
        vehicleTypes: 'Uri ng Sasakyan',
        inventoryTitle: 'Pamamahala ng Imbentaryo',
        addVehicle: 'Magdagdag ng Sasakyan',
        editVehicle: 'I-edit ang Sasakyan',
        deleteVehicle: 'Tanggalin ang Sasakyan',
        vehicleName: 'Pangalan ng Sasakyan',
        brand: 'Tatak',
        model: 'Modelo',
        year: 'Taon',
        price: 'Presyo',
        status: 'Katayuan',
        actions: 'Mga Aksyon',
        available: 'Available',
        sold: 'Nabenta',
        reserved: 'Nakareserba',
        ready: 'Handa',
        repair: 'Sa Repair',
        condition: 'Kondisyon',
        creditSimulation: 'Simulation ng Kredito',
        tenor: 'Tenor',
        downPayment: 'Down Payment',
        monthlyPayment: 'Buwanang Bayad',
        interestRate: 'Interest Rate',
        save: 'I-save',
        cancel: 'Kanselahin',
        confirm: 'Kumpirmahin',
        loading: 'Naglo-load...',
        noData: 'Walang data',

        // Auth Page
        authUserEmail: 'Username / Email',
        authPassword: 'Password',
        authFullName: 'Buong Pangalan',
        authEmailActive: 'Aktibong Email',
        authCreatePass: 'Gumawa ng Password',
        authEmailReg: 'Nakarehistrong Email',
        authErrRequired: 'Mangyaring punan ang patlang na ito',
        authBtnLogin: 'MAG-LOGIN',
        authBtnSignup: 'MAG-SIGN UP',
        authBtnReset: 'IPADALA ANG RESET LINK',
        authBtnCancel: 'KANSELAHIN',
        authForgotPass: 'Nakalimutan ang Password?',
        authForgotDesc: 'Ilagay ang iyong email, magpapadala kami ng link para i-reset ang password.',
        authNoAccount: 'Wala pang account?',
        authHaveAccount: 'May account na?',
        authLinkSignup: 'Magparehistro Ngayon',
        authLinkLogin: 'Mag-login Dito',
        authAlertLogin: 'Pinoproseso ang pag-login...',
        authAlertSignup: 'Matagumpay na nagawa ang account!',
        authAlertForgot: 'Naipadala na ang reset link!',
        authErrLoginFailed: 'Nabigo ang pag-login. Suriin ang iyong mga kredensyal.',
        authErrSignupFailed: 'Nabigo ang pag-sign up. Maaaring nakuha na ang email.',
        authRememberMe: 'Tandaan Ako',
        settingsTitle: 'Mga Setting',
        companyProfile: 'Profile ng Kumpanya',
        companyProfileDesc: 'Makikita ang impormasyon na ito sa header ng invoice',
        dealerName: 'Pangalan ng Dealer / Kumpanya',
        fullAddress: 'Buong Address',
        phoneNumber: 'Numero ng Telepono',
        businessEmail: 'Email ng Negosyo',
        accountInfo: 'Impormasyon ng Account',
        planTier: 'Plano',
        changePassword: 'Baguhin ang Password',
        changePasswordDesc: 'Siguraduhing may hindi bababa sa 6 na character ang bagong password',
        currentPassword: 'Kasalukuyang Password',
        newPassword: 'Bagong Password',
        confirmNewPassword: 'Kumpirmahin ang Bagong Password',
        notificationPrefs: 'Mga Kagustuhan sa Notipikasyon',
        notificationPrefsDesc: 'Pamahalaan ang mga notipikasyong natatanggap mo',
        emailReminders: 'Mga Paalala sa Email',
        emailRemindersDesc: 'Tumanggap ng mga paalala sa pagbabayad at due date',
        paymentAlerts: 'Mga Alerto sa Pagbabayad',
        paymentAlertsDesc: 'Mga notipikasyon para sa papasok na bayad o bagong invoice',
        systemUpdates: 'Mga Update sa Sistema',
        systemUpdatesDesc: 'Bagong feature at maintenance info',
        marketingEmails: 'Marketing Emails',
        marketingEmailsDesc: 'Mga promo at espesyal na alok',
        saveChanges: 'I-save ang mga Pagbabago',
        saveSettings: 'I-save ang mga Setting',
        currencyPreference: 'Pera',
        transactionTitle: 'Mga Transaksyon',
        transactionDesc: 'Pamahalaan ang pagbili at pagbenta ng sasakyan',
        newTransaction: 'Bagong Transaksyon',
        saleType: 'Pagbenta',
        purchaseType: 'Pagbili',
        paymentMethod: 'Paraan ng Pagbabayad',
        cash: 'Cash',
        totalAmount: 'Kabuuang Halaga',
        invoice: 'Invoice',
        selectVehicle: 'Pumili ng Sasakyan',
        selectCustomer: 'Pumili ng Customer',
        transactionDate: 'Petsa ng Transaksyon',
        notes: 'Mga Tala',
        reportsTitle: 'Mga Ulat at Estadistika',
        reportsDesc: 'Subaybayan ang performance ng negosyo sa real-time',
        soldThisMonth: 'Nabenta Ngayong Buwan',
        revenueThisMonth: 'Kita Ngayong Buwan',
        fromLastMonth: 'mula noong nakaraang buwan',
        newThisMonth: 'bago ngayong buwan',
        monthlySalesChart: 'Buwanang Benta',
        unitsSoldAndRevenue: 'Mga unit na nabenta at kita',
        topBrands: 'Nangungunang Brand',
        revenueByCategory: 'Kita ayon sa Kategorya',
        performanceTitle: 'Performance',
        avgStockDays: 'Ave. Tagal ng Stock',
        avgMargin: 'Average na Margin',
        conversionRate: 'Rate ng Conversion',
        totalSoldPeriod: 'Kabuuang Nabenta',
        noSalesData: 'Wala pang data ng benta',
        monthLabel: 'Buwan',
        yearLabel: 'Taon',
        unit: 'unit',
        days: 'araw',
        exportVehicles: 'Sasakyan (CSV)',
        exportCustomers: 'Customer (CSV)',
        exportTransactions: 'Transaksyon (CSV)',
        exportSuccess: 'Matagumpay na na-export ang data',
        exportFailed: 'Hindi na-export ang data. Subukan muli.',
        calendarTitle: 'Kalendaryo',
        today: 'Ngayon',
        upcomingPayments: 'Paparating na Bayad',
        installment: 'Hulog',
        masterTitle: 'Master Data',
        masterDesc: 'Pamahalaan ang mga brand, modelo, at kategorya ng sasakyan',
        addBrand: 'Magdagdag ng Brand',
        addModel: 'Magdagdag ng Modelo',
        brandName: 'Pangalan ng Brand',
        modelName: 'Pangalan ng Modelo',
        variants: 'Mga Variant',
        editBrand: 'I-edit ang Brand',
        deleteBrand: 'Tanggalin ang Brand',
        manageCategories: 'Pamahalaan ang mga Kategorya',
        staffTitle: 'Pamamahala ng Staff',
        staffDesc: 'Pamahalaan ang sales team at access ng user',
        addStaff: 'Magdagdag ng Staff',
        editStaff: 'I-edit ang Staff',
        deleteStaff: 'Tanggalin ang Staff',
        fullAccess: 'Buong access',
        limitedAccess: 'Limitadong access',
        role: 'Papel',
        joined: 'Sumali',
        contact: 'Kontak',
        password: 'Password',
        minChars: 'Hindi bababa sa 6 na character',
        searchNameEmail: 'Maghanap ng pangalan o email...',
        noStaffFound: 'Walang nahanap na staff',
        deleteStaffConfirm: 'Tanggalin ang Staff?',
        deleteStaffWarning: 'Sigurado ka bang gusto mong tanggalin ang staff na ito? Hindi na maibabalik ang aksyong ito.',
        yesDelete: 'Oo, Tanggalin',
        branchTitle: 'Mga Sangay',
        addBranch: 'Magdagdag ng Sangay',
        branchName: 'Pangalan ng Sangay',
        branchAddress: 'Address ng Sangay',
        branchPhone: 'Telepono ng Sangay',
        billingTitle: 'Billing',
        currentPlan: 'Kasalukuyang Plano',
        invoiceHistory: 'Kasaysayan ng Invoice',
        payNow: 'Magbayad Ngayon',
        activityTitle: 'Aktibidad',
        recentActivity: 'Kamakailang Aktibidad',
        activityLog: 'Log ng Aktibidad',
        delete: 'Tanggalin',
        edit: 'I-edit',
        close: 'Isara',
        back: 'Bumalik',
        next: 'Susunod',
        previous: 'Nakaraan',
        all: 'Lahat',
        pending: 'Naghihintay',
        paid: 'Bayad na',
        cancelled: 'Kinansela',
        completed: 'Tapos na',
        failed: 'Nabigo',
        success: 'Tagumpay',
        error: 'Error',
        warning: 'Babala',
        requiredFields: 'Pakikumpleto ang lahat ng kinakailangang field',
    },
    vi: {
        menu: 'Menu',
        otherMenu: 'Menu Khác',
        dashboard: 'Bảng Điều Khiển',
        listing: 'Danh Sách',
        calendar: 'Lịch',
        deals: 'Giao Dịch',
        tracking: 'Theo Dõi',
        activeBids: 'Đấu Giá',
        statistics: 'Thống Kê',
        transaction: 'Giao Dịch',
        credit: 'Tín Dụng',
        customer: 'Khách Hàng',
        masterData: 'Dữ Liệu Chính',
        reports: 'Báo Cáo',
        staff: 'Đội Bán Hàng',
        branch: 'Chi Nhánh',
        stockTransfer: 'Chuyển Kho',
        billing: 'Hóa Đơn',
        activity: 'Hoạt Động',
        dealerGroup: 'Dealer Group',
        search: 'Tìm Kiếm',
        settings: 'Cài Đặt',
        helpCenter: 'Trung Tâm Hỗ Trợ',
        logout: 'Đăng Xuất',
        searchPlaceholder: 'Nhập để tìm kiếm...',
        notifications: 'Thông Báo',
        vehicleListing: 'Danh Sách Xe',
        latestUpdate: 'Cập nhật mới nhất 7 ngày',
        filterBy: 'Lọc theo',
        export: 'Xuất',
        fixedPrice: 'Giá Cố Định',
        callForPrice: 'Liên Hệ Để Biết Giá',
        statsTitle: 'Thống Kê Kinh Doanh',
        totalVehicles: 'Tổng Số Xe',
        totalSales: 'Tổng Doanh Số',
        revenue: 'Doanh Thu',
        pendingDeals: 'Giao Dịch Chờ',
        monthlySales: 'Doanh Số Hàng Tháng',
        vehicleTypes: 'Loại Xe',
        inventoryTitle: 'Quản Lý Kho',
        addVehicle: 'Thêm Xe',
        editVehicle: 'Sửa Xe',
        deleteVehicle: 'Xóa Xe',
        vehicleName: 'Tên Xe',
        brand: 'Hãng',
        model: 'Mẫu',
        year: 'Năm',
        price: 'Giá',
        status: 'Trạng Thái',
        actions: 'Hành Động',
        available: 'Có Sẵn',
        sold: 'Đã Bán',
        reserved: 'Đã Đặt',
        ready: 'Sẵn Sàng',
        repair: 'Đang Sửa',
        condition: 'Tình Trạng',
        creditSimulation: 'Mô Phỏng Tín Dụng',
        tenor: 'Thời Hạn',
        downPayment: 'Trả Trước',
        monthlyPayment: 'Trả Hàng Tháng',
        interestRate: 'Lãi Suất',
        save: 'Lưu',
        cancel: 'Hủy',
        confirm: 'Xác Nhận',
        loading: 'Đang tải...',
        noData: 'Không có dữ liệu',

        // Auth Page
        authUserEmail: 'Tên người dùng / Email',
        authPassword: 'Mật khẩu',
        authFullName: 'Họ và tên',
        authEmailActive: 'Email hoạt động',
        authCreatePass: 'Tạo mật khẩu',
        authEmailReg: 'Email đã đăng ký',
        authErrRequired: 'Vui lòng điền vào trường này',
        authBtnLogin: 'ĐĂNG NHẬP',
        authBtnSignup: 'ĐĂNG KÝ',
        authBtnReset: 'GỬI LIÊN KẾT ĐẶT LẠI',
        authBtnCancel: 'HỦY BỎ',
        authForgotPass: 'Quên mật khẩu?',
        authForgotDesc: 'Nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.',
        authNoAccount: 'Chưa có tài khoản?',
        authHaveAccount: 'Đã có tài khoản?',
        authLinkSignup: 'Đăng ký ngay',
        authLinkLogin: 'Đăng nhập tại đây',
        authAlertLogin: 'Đang xử lý đăng nhập...',
        authAlertSignup: 'Tài khoản đã được tạo!',
        authAlertForgot: 'Đã gửi liên kết đặt lại!',
        authErrLoginFailed: 'Đăng nhập thất bại. Kiểm tra thông tin của bạn.',
        authErrSignupFailed: 'Đăng ký thất bại. Email có thể đã được sử dụng.',
        authRememberMe: 'Ghi nhớ tôi',
        settingsTitle: 'Cài đặt',
        companyProfile: 'Hồ sơ Công ty',
        companyProfileDesc: 'Thông tin này sẽ hiển thị trên tiêu đề hóa đơn',
        dealerName: 'Tên Đại lý / Công ty',
        fullAddress: 'Địa chỉ đầy đủ',
        phoneNumber: 'Số điện thoại',
        businessEmail: 'Email doanh nghiệp',
        accountInfo: 'Thông tin tài khoản',
        planTier: 'Gói',
        changePassword: 'Đổi mật khẩu',
        changePasswordDesc: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        currentPassword: 'Mật khẩu hiện tại',
        newPassword: 'Mật khẩu mới',
        confirmNewPassword: 'Xác nhận mật khẩu mới',
        notificationPrefs: 'Tùy chọn thông báo',
        notificationPrefsDesc: 'Quản lý thông báo bạn nhận được',
        emailReminders: 'Nhắc nhở email',
        emailRemindersDesc: 'Nhận nhắc nhở thanh toán và ngày đến hạn',
        paymentAlerts: 'Cảnh báo thanh toán',
        paymentAlertsDesc: 'Thông báo khi có thanh toán hoặc hóa đơn mới',
        systemUpdates: 'Cập nhật hệ thống',
        systemUpdatesDesc: 'Thông tin tính năng mới và bảo trì',
        marketingEmails: 'Email tiếp thị',
        marketingEmailsDesc: 'Khuyến mãi và ưu đãi đặc biệt',
        saveChanges: 'Lưu thay đổi',
        saveSettings: 'Lưu cài đặt',
        currencyPreference: 'Tiền tệ',
        transactionTitle: 'Giao dịch',
        transactionDesc: 'Quản lý mua bán xe',
        newTransaction: 'Giao dịch mới',
        saleType: 'Bán',
        purchaseType: 'Mua',
        paymentMethod: 'Phương thức thanh toán',
        cash: 'Tiền mặt',
        totalAmount: 'Tổng giá',
        invoice: 'Hóa đơn',
        selectVehicle: 'Chọn xe',
        selectCustomer: 'Chọn khách hàng',
        transactionDate: 'Ngày giao dịch',
        notes: 'Ghi chú',
        reportsTitle: 'Báo cáo & Thống kê',
        reportsDesc: 'Theo dõi hiệu quả kinh doanh theo thời gian thực',
        soldThisMonth: 'Đã bán tháng này',
        revenueThisMonth: 'Doanh thu tháng này',
        fromLastMonth: 'so với tháng trước',
        newThisMonth: 'mới tháng này',
        monthlySalesChart: 'Doanh số hàng tháng',
        unitsSoldAndRevenue: 'Số lượng bán và doanh thu',
        topBrands: 'Thương hiệu bán chạy',
        revenueByCategory: 'Doanh thu theo danh mục',
        performanceTitle: 'Hiệu suất',
        avgStockDays: 'Thời gian tồn kho trung bình',
        avgMargin: 'Lợi nhuận trung bình',
        conversionRate: 'Tỷ lệ chuyển đổi',
        totalSoldPeriod: 'Tổng đã bán',
        noSalesData: 'Chưa có dữ liệu bán hàng',
        monthLabel: 'Tháng',
        yearLabel: 'Năm',
        unit: 'chiếc',
        days: 'ngày',
        exportVehicles: 'Xe (CSV)',
        exportCustomers: 'Khách hàng (CSV)',
        exportTransactions: 'Giao dịch (CSV)',
        exportSuccess: 'Xuất dữ liệu thành công',
        exportFailed: 'Xuất dữ liệu thất bại. Vui lòng thử lại.',
        calendarTitle: 'Lịch',
        today: 'Hôm nay',
        upcomingPayments: 'Thanh toán sắp tới',
        installment: 'Trả góp',
        masterTitle: 'Dữ liệu chính',
        masterDesc: 'Quản lý thương hiệu, mẫu xe và danh mục',
        addBrand: 'Thêm thương hiệu',
        addModel: 'Thêm mẫu xe',
        brandName: 'Tên thương hiệu',
        modelName: 'Tên mẫu xe',
        variants: 'Biến thể',
        editBrand: 'Sửa thương hiệu',
        deleteBrand: 'Xóa thương hiệu',
        manageCategories: 'Quản lý danh mục',
        staffTitle: 'Quản lý nhân viên',
        staffDesc: 'Quản lý đội ngũ bán hàng và quyền truy cập',
        addStaff: 'Thêm nhân viên',
        editStaff: 'Sửa nhân viên',
        deleteStaff: 'Xóa nhân viên',
        fullAccess: 'Toàn quyền',
        limitedAccess: 'Quyền hạn chế',
        role: 'Vai trò',
        joined: 'Tham gia',
        contact: 'Liên hệ',
        password: 'Mật khẩu',
        minChars: 'Ít nhất 6 ký tự',
        searchNameEmail: 'Tìm tên hoặc email...',
        noStaffFound: 'Không tìm thấy nhân viên',
        deleteStaffConfirm: 'Xóa nhân viên?',
        deleteStaffWarning: 'Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.',
        yesDelete: 'Có, Xóa',
        branchTitle: 'Chi nhánh',
        addBranch: 'Thêm chi nhánh',
        branchName: 'Tên chi nhánh',
        branchAddress: 'Địa chỉ chi nhánh',
        branchPhone: 'Điện thoại chi nhánh',
        billingTitle: 'Thanh toán',
        currentPlan: 'Gói hiện tại',
        invoiceHistory: 'Lịch sử hóa đơn',
        payNow: 'Thanh toán ngay',
        activityTitle: 'Hoạt động',
        recentActivity: 'Hoạt động gần đây',
        activityLog: 'Nhật ký hoạt động',
        delete: 'Xóa',
        edit: 'Sửa',
        close: 'Đóng',
        back: 'Quay lại',
        next: 'Tiếp theo',
        previous: 'Trước',
        all: 'Tất cả',
        pending: 'Đang chờ',
        paid: 'Đã thanh toán',
        cancelled: 'Đã hủy',
        completed: 'Hoàn thành',
        failed: 'Thất bại',
        success: 'Thành công',
        error: 'Lỗi',
        warning: 'Cảnh báo',
        requiredFields: 'Vui lòng điền đầy đủ các trường bắt buộc',
    },
};

export default translations;
