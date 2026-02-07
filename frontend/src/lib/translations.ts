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
    },
};

export default translations;
