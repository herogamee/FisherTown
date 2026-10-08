FisherTown Fishing Lab v0.3.1 — วิธีเล่นและติดตั้ง

เล่นออนไลน์ (ฟรี):
https://herogamee.github.io/FisherTown/

ติดตั้งบน Windows + XAMPP (ไฟล์ Build สำเร็จรูป)
1) ดาวน์โหลด GitHub Actions artifact ชื่อ FisherTown-v0.3.1-Web
2) แตก ZIP แล้วเปิด XAMPP Control Panel
3) Start Apache
4) ดับเบิลคลิก START-XAMPP.cmd
5) Browser เปิด http://localhost/fishertown/

หมายเหตุ:
- Build เป็น Static Web ไม่ต้อง npm install
- START-XAMPP.cmd ใช้ C:\xampp3\htdocs เป็นค่าเริ่มต้น
- ถ้าใช้ XAMPP คนละที่ ให้แก้ XAMPP_HTDOCS ใน START-XAMPP.cmd

เล่นบนมือถือ Wi-Fi เดียวกัน:
1) หา IPv4 คอมพิวเตอร์ เช่น 192.168.1.50
2) เปิด http://192.168.1.50/fishertown/ ในมือถือ
3) Windows Firewall ต้องอนุญาต Apache (Private network)

รูปแบบการเล่น:
- แนวนอน: ใช้ปุ่มบนฉากเกมเดิม
- แนวตั้ง: ฉากตกปลาอยู่ด้านบน ปุ่มสัมผัสอยู่ด้านล่าง เลื่อนแผงควบคุมได้
- กดค้าง "เหวี่ยงเบ็ด" แล้วปล่อยเพื่อเหวี่ยง
- กด "HOOK!" เมื่อปลากินเหยื่อ
- กดค้าง "ดึงสาย" และปล่อยเมื่อแรงตึงสูง อย่าให้สายหย่อนนาน
- หลังจับปลา กด "ปล่อยคืนสู่ธรรมชาติ"
- ปุ่ม ⛶ มุมขวาบนใช้ขยายเต็มจอ/กลับ

เผยแพร่เว็บฟรี: สามารถอัปโหลดโฟลเดอร์ Build ไป Netlify Drop (https://app.netlify.com/drop)
ข้อมูล Fishdex และสถิติอยู่ใน LocalStorage ของเบราว์เซอร์เครื่องนั้น

ไฟล์นี้เป็น Production Web Build จาก FisherTown CI v0.3.1
