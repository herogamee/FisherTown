FisherTown Fishing Lab v0.1 — วิธีเล่น

แบบเร็วที่สุดบน Windows + XAMPP
1) แตก ZIP นี้
2) เปิด XAMPP Control Panel
3) Start Apache
4) ดับเบิลคลิก START-XAMPP.cmd
5) Browser จะเปิด http://localhost/fishertown/

หมายเหตุ:
- เกมนี้เป็น Static Web build สำเร็จรูป ไม่ต้อง npm install
- ถ้า XAMPP ของคุณอยู่ C:\xampp3 จะใช้ได้ทันที
- ถ้าใช้ XAMPP คนละที่ ให้แก้ตัวแปร XAMPP_HTDOCS ใน START-XAMPP.cmd

เล่นบนมือถือใน Wi-Fi เดียวกัน
1) ดู IPv4 ของคอม เช่น 192.168.1.50
2) เปิดจากมือถือ: http://192.168.1.50/fishertown/
3) Windows Firewall ต้องอนุญาต Apache ใน Private network

ขึ้นเว็บฟรี
วิธีง่ายสุด: Netlify Drop
1) ไป https://app.netlify.com/drop
2) ลาก ZIP หรือโฟลเดอร์นี้ลงหน้าเว็บ
3) ได้ URL *.netlify.app แล้วเปิดจากมือถือได้ทันที

ไฟล์ในโฟลเดอร์นี้คือ Production Web Build ที่ build จาก main และผ่าน FisherTown CI
