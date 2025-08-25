# Certificate Verification App - Hướng dẫn chi tiết

Ứng dụng xác thực chứng chỉ sử dụng **ReactJS**, **ExpressJS**, **MySQL**, **Truffle/Ganache** và **IPFS**.

---

## 🚀 Tính năng

1. Quản lý và lưu trữ chứng chỉ số
2. Lưu trữ file chứng chỉ trên **IPFS**
3. Xác thực chứng chỉ qua **Smart Contract (Ethereum/Ganache)**
4. API backend kết nối MySQL, blockchain và IPFS
5. Giao diện React thân thiện để quản lý và tra cứu chứng chỉ

---

## ⚙️ Yêu cầu hệ thống

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Python** >= 3.7 (cho một số dependencies)
- **Git**
- **XAMPP** hoặc **MySQL Server** >= 8.0
- **Visual Studio Code** (khuyến nghị)

---

## 📥 Cài đặt từng bước

### Bước 1: Clone dự án và cài đặt dependencies

```bash
# Clone repository
git clone https://github.com/ckq7703/app-vbcc.git
cd app-vbcc

# Cài đặt các dependencies chính
npm install

```

### Bước 2: Cài đặt Truffle Framework

```bash
# Cài đặt Truffle globally
npm install -g truffle

# Kiểm tra version
truffle version


```

### Bước 3: Cài đặt và cấu hình Ganache

#### Ganache GUI
1. Tải về từ: https://trufflesuite.com/ganache/
2. Cài đặt và khởi động
3. Tạo workspace mới với cấu hình:
   - **Server**: HTTP://127.0.0.1:8545
   - **Network ID**: 1337
   - **Accounts**: 10
   - **Mnemonic**: Lưu lại để sử dụng

### Bước 4: Cài đặt và cấu hình IPFS

#### Cách 1: IPFS Desktop (Dễ sử dụng)
1. Tải về từ: https://github.com/ipfs/ipfs-desktop/releases
2. Cài đặt và khởi động
3. IPFS sẽ chạy tại: http://localhost:5001
4. Web UI tại: http://localhost:5001/webui

#### Cấu hình CORS cho IPFS
```bash
# Cho phép truy cập từ React app
# Truy cập C:\Users\xxx\.ipfs\config và thêm nội dung như sau:
	"API": {
	  "HTTPHeaders": {
		"Access-Control-Allow-Origin": ["*"],
		"Access-Control-Allow-Methods": ["GET", "POST", "PUT"],
		"Access-Control-Allow-Headers": ["Authorization"]
	  }
	},

```

---

## 🔧 Cấu hình chi tiết

## 🗄️ Cài đặt Database

### 1. Cài đặt MySQL

#### Với XAMPP:
1. Tải và cài đặt XAMPP từ: https://www.apachefriends.org/
2. Khởi động Apache và MySQL
3. Truy cập phpMyAdmin: http://localhost/phpmyadmin

#### Với MySQL Server:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Windows - tải từ: https://dev.mysql.com/downloads/mysql/
# macOS
brew install mysql
```

### 2. Tạo Database và Import dữ liệu

```sql
-- Tạo database
CREATE DATABASE certificate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sử dụng database
USE certificate_db;

-- Import từ file SQL
SOURCE database/certificate_db.sql;

```

---

## ⛓️ Deploy Smart Contract

### 1. Deploy Contract

```bash
# Lưu ý: trước khi deploy contract hãy xóa thư mục Build và file cert.json trong thư mục src

# Compile contracts
truffle compile

# Deploy to development network (Ganache)
truffle migrate --network development --reset

# Kiểm tra deployment
truffle console --network development
```

### 4. **QUAN TRỌNG: Copy ABI file**

Sau khi deploy thành công, copy file ABI:

```bash
# Copy file JSON từ build/contracts đến src của React app
cp build/contracts/cert.json src/


```

### 5. Cập nhật CONTRACT_ADDRESS trong .env

Lấy địa chỉ contract từ kết quả deploy và cập nhật vào file `.env`:

```env
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

---

## 🖥️ Chạy ứng dụng từng bước

### Bước 1: Khởi động các dịch vụ

```bash
# Khởi động Ganache UI
# Khởi động XAMPP Control Panel và start Apache + MySQL
# Mở IPFS Desktop
```

### Bước 2: Deploy Smart Contract

```bash
# Terminal 4
truffle migrate --network development --reset

# Copy ABI file
cp build/contracts/cert.json src/
```

### Bước 3: Khởi động Backend

```bash
# Terminal 5
npm run server
# Hoặc
cd backend && npm start
```

### Bước 4: Khởi động Frontend

```bash
 
cd src && npm start
```

### Bước 5: Kiểm tra các endpoint

- **Frontend**: http://localhost:5001
- **Backend API**: http://localhost:5000
- **IPFS Gateway**: http://localhost:8080/ipfs/
- **IPFS WebUI**: http://localhost:5002/webui
- **Ganache**: http://localhost:8545

---




```
...
## 🚨 Lưu ý quan trọng

1. **Luôn copy file ABI**: Sau mỗi lần deploy contract, nhớ copy file `.json` từ `build/contracts` sang `src/`
2. **Cập nhật CONTRACT_ADDRESS**: Địa chỉ contract sẽ thay đổi mỗi lần deploy
3. **Kiểm tra ports**: Đảm bảo các port không bị conflict
4. **Backup mnemonic**: Lưu lại mnemonic của Ganache để khôi phục accounts
5. **IPFS CORS**: Cấu hình CORS cho IPFS để frontend có thể truy cập
6. **Dependencies version**: Kiểm tra compatibility giữa các package versions

Hệ thống sẽ hoạt động trơn tru khi tất cả các bước trên được thực hiện đúng thứ tự!
