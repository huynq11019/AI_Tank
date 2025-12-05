# 📝 README - C++ Bot Build Instructions

## ⚠️ Lưu ý quan trọng về Platform

### Windows ✅
- **Hoạt động tốt**: Sử dụng Visual Studio để build
- **Thư viện**: File `.lib` trong thư mục `lib/` tương thích với Windows
- **Khuyến nghị**: Đây là platform chính thức để build C++ bot

### macOS/Linux ❌
- **KHÔNG tương thích**: File `.lib` là Windows static libraries (COFF format)
- **Không thể build**: macOS/Linux linker không thể sử dụng file `.lib` này
- **Khuyến nghị**: Sử dụng JavaScript bot template thay thế

## 🚀 Quick Start

### Trên Windows

```cmd
REM Sử dụng Visual Studio
1. Mở AI_Template.sln
2. Build → Build Solution (Ctrl+Shift+B)
3. Chạy: 2015_Debug\AI_Template.exe -h 127.0.0.1 -p 3011 -k 30

REM Hoặc dùng script
build.bat
AI_Template.exe -h 127.0.0.1 -p 3011 -k 30
```

### Trên macOS/Linux

```bash
# Sử dụng JavaScript bot (khuyến nghị)
cd ../../Javascript
node Client.js -h 127.0.0.1 -p 3011 -k 30
```

## 📚 Tài liệu đầy đủ

- **Hướng dẫn tạo bot**: [huong_dan_tao_bot_cpp.md](file:///Users/macbookpro/.gemini/antigravity/brain/75760f89-49e9-4462-8cdd-4d69aec01bc2/huong_dan_tao_bot_cpp.md)
- **Hướng dẫn build**: [huong_dan_build_cpp.md](file:///Users/macbookpro/.gemini/antigravity/brain/75760f89-49e9-4462-8cdd-4d69aec01bc2/huong_dan_build_cpp.md)

## 🔧 Files trong thư mục

```
AI_Template/
├── src/
│   └── main.cpp          ← Viết AI logic ở đây
├── include/
│   └── ai/               ← Header files (API)
├── lib/
│   └── *.lib             ← Windows static libraries
├── build.sh              ← Build script (macOS/Linux - chỉ tham khảo)
├── build.bat             ← Build script (Windows)
└── AI_Template.sln       ← Visual Studio solution
```

## ❓ FAQ

**Q: Tại sao không build được trên macOS?**
A: File `.lib` là Windows format, không tương thích với macOS linker. Dùng JavaScript bot hoặc build trên Windows.

**Q: Có cách nào build C++ bot trên macOS không?**
A: Có, nhưng phức tạp:
- Rebuild thư viện từ source code (nếu có)
- Dùng Wine + Visual Studio
- Cross-compile từ Windows

**Q: JavaScript bot có tốt như C++ không?**
A: Có! JavaScript bot có đầy đủ tính năng và dễ phát triển hơn.

## 📞 Hỗ trợ

Xem hướng dẫn chi tiết trong các file markdown được tạo.
