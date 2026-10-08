FisherTown Fishing Lab v0.4 — วิธีเล่น / ติดตั้ง

เล่นผ่านเว็บ:
https://herogamee.github.io/FisherTown/

ดาวน์โหลด Build สำหรับ Windows + XAMPP:
1) เปิด https://github.com/herogamee/FisherTown/actions
2) เลือก CI ที่ผ่านจาก main แล้วดาวน์โหลด artifact "FisherTown-v0.4-Web"
3) แตก ZIP เปิด XAMPP Control Panel แล้ว Start Apache
4) ดับเบิลคลิก START-XAMPP.cmd
5) Browser เปิด http://localhost/fishertown/

- เกมเป็น Static Web Build; ไม่จำเป็นต้อง npm install หากใช้ ZIP จาก Actions
- ค่าเริ่มต้นของ Installer เป็น C:\xampp3\htdocs
- เปลี่ยน XAMPP_HTDOCS ใน START-XAMPP.cmd หากติดตั้งที่อื่น

เล่นบนมือถือ Wi-Fi เดียวกัน:
- ใช้ IPv4 ของคอม เช่น http://192.168.1.50/fishertown/
- ต้องอนุญาต Apache ผ่าน Windows Firewall (Private network)
- รองรับแนวตั้งและแนวนอนโดยไม่บังคับให้หมุนหน้าจอ

วิธีเล่น:
1) เลือกเหยื่อ
2) กดค้าง "เหวี่ยงเบ็ด" แล้วปล่อย
3) รอปลาเข้าใกล้และกินเหยื่อ
4) เมื่อเห็นสัญญาณ กด "HOOK!"
5) กดค้าง/ปล่อย "ดึงสาย" คุมแรงตึงประมาณ 20–82%
6) จับปลาและกด "ปล่อยคืนสู่ธรรมชาติ" สถิติเซฟในเครื่อง

คุณภาพภาพ:
- อัตโนมัติ: ลดรายละเอียดถ้า FPS ต่ำอย่างต่อเนื่อง
- ประหยัด: ลดจำนวนและความถี่การวาดเอฟเฟกต์น้ำ
- สมดุล: ค่าเริ่มต้นเน้นภาพและความลื่น
- สูง: เอฟเฟกต์น้ำละเอียดขึ้น
- ปุ่ม ⛶ ใช้เข้า/ออกโหมดเต็มจอ

หมายเหตุ: การทดสอบอัตโนมัติตรวจ Build และ Browser Chrome Desktop/Portrait แต่ผู้พัฒนายังควรทดสอบบน Android/iOS เครื่องจริง โดยเฉพาะการพักเกม การกลับเข้าเกม และการจับปลาเต็มรอบ
