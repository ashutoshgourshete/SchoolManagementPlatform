# EduManage SaaS - पूर्ण प्रक्रिया व मोबाईल वापर मार्गदर्शक (Operations & Mobile Guide)

हा दस्तऐवज (Document) प्रणाली चालवण्यासाठी, मोबाईलवर वापरण्यासाठी आणि समस्या निवारणासाठी (Troubleshooting) संपूर्ण तांत्रिक व व्यावसायिक मार्गदर्शक आहे.

---

## १. प्रणाली चालवण्याची संपूर्ण प्रक्रिया (System Startup Process)

### पायरी १: बॅकएंड सुरू करणे (.NET 8 Web API)
१. टर्मिनल उघडा आणि रूट डिरेक्टरीमध्ये जा:
   ```bash
   cd SchoolManagementPlatform/SchoolManagement.API
   ```
२. डेटाबेस मायग्रेशन्स अपडेट करा (पहिल्यांदा किंवा नवीन बदल असल्यास):
   ```bash
   dotnet ef database update --project ../SchoolManagement.Data --startup-project .
   ```
३. API सर्व्हर चालू करा:
   - **फक्त PC वर चाचणीसाठी:**
     ```bash
     dotnet run
     ```
   - **मोबाईलवर किंवा लोकल नेटवर्कवर चाचणीसाठी (Network Accessible):**
     ```bash
     dotnet run --urls="http://0.0.0.0:5000"
     ```
४. API Swagger दस्तऐवज: `http://localhost:5000/swagger` किंवा `https://localhost:5001/swagger`

---

### पायरी २: फ्रंटएंड सुरू करणे (Angular 18+ SPA)
१. दुसऱ्या टर्मिनलमध्ये `school-management-ui` डिरेक्टरीमध्ये जा:
   ```bash
   cd SchoolManagementPlatform/school-management-ui
   ```
२. पॅकेजेस इन्स्टॉल करा (फक्त पहिल्यांदा):
   ```bash
   npm install
   ```
३. डेव्हलपमेंट सर्व्हर सुरू करा:
   - **फक्त PC वर चाचणीसाठी:**
     ```bash
     npm start
     ```
   - **मोबाईलवरून ऍक्सेस करण्यासाठी (Wi-Fi द्वारे):**
     ```bash
     npm start -- --host 0.0.0.0 --disable-host-check
     ```
४. ब्राउझरमध्ये उघडा: `http://localhost:4200`

---

## २. मोबाईलमध्ये ऍप्लिकेशन कसे वापरावे? (Mobile Usage Methods)

EduManage हे 100% Mobile Responsive आणि Touch-Friendly डिझाइन केलेले आहे. मोबाईलमध्ये वापरण्यासाठी खालील **३ पद्धती** उपलब्ध आहेत:

---

### पद्धत ४: Cloudflare Tunnel द्वारे इंटरनेटवर १००% मोफत व सुरक्षित थेट लाईव्ह चालवणे (Zero Cost)
कोणताही सर्व्हर किंवा डोमेन विकत न घेता तुमच्या PC वरून संपूर्ण जगात मोफत व बँक-दर्जाच्या सुरक्षिततेने लाईव्ह करण्यासाठी:

1. **`cloudflared-windows-amd64.exe` डाऊनलोड करा:**
   - [Cloudflare अधिकृत रिलीझ लिंक](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe)
   - ही `.exe` फाईल डाऊनलोड करून त्याचे नाव बदलून `cloudflared.exe` ठेवा आणि प्रोजेक्टच्या मुख्य फोल्डरमध्ये ठेवा (किंवा Windows PATH मध्ये ॲड करा).

2. **एका क्लिकमध्ये सर्व सुरू करा:**
   - प्रोजेक्टच्या मुख्य फोल्डरमधील **`start-live-tunnel.bat`** वर डबल क्लिक करा.
   - किंवा स्वतः ३ कमांड्स वेगवेगळ्या विंडोमध्ये चालवा:
     ```powershell
     # विंडो १: Backend
     cd SchoolManagement.API && dotnet run

     # विंडो २: Frontend with Proxy
     cd school-management-ui && npm run start:tunnel

     # विंडो ३: Cloudflare Tunnel
     cloudflared tunnel --url http://localhost:4200
     ```

3. **मोफत सुरक्षित लिंक मिळवा:**
   - स्क्रीनवर `https://xxxxxx.trycloudflare.com` अशी HTTPS लिंक दिसेल.
   - ही लिंक कोणत्याही मोबाईलवर किंवा इतर कोणालाही पाठवून लगेच लॉगिन करून दाखवा!

---

### पद्धत १: एकाच वायफाय (Wi-Fi) नेटवर्कवर मोबाईल ब्राउझरमध्ये चालवणे (झटपट पद्धत)
जर तुमचा कॉम्प्युटर आणि मोबाईल एकाच Wi-Fi शी जोडलेले असतील:

1. **कॉम्प्युटरचा Local IP Address शोधा:**
   - Windows PowerShell मध्ये कमांड चालवा:
     ```powershell
     ipconfig
     ```
   - `IPv4 Address` तपासा (उदा. `192.168.1.15`).

2. **सर्व्हर्स नेटवर्क मोडमध्ये चालू करा:**
   - **Backend:**
     ```powershell
     cd SchoolManagement.API
     dotnet run --urls="http://0.0.0.0:5000"
     ```
   - **Frontend:**
     ```powershell
     cd school-management-ui
     npm start -- --host 0.0.0.0 --disable-host-check
     ```

3. **मोबाईलमधील Chrome किंवा Safari ब्राउझर उघडा:**
   - पत्ता टाका: `http://192.168.1.15:4200` (तुमचा IP टाका).
   - ऍप्लिकेशन मोबाईल स्क्रीननुसार आपोआप ॲडजस्ट होईल.
   - डाव्या बाजूला वरती **☰ (Hamburger Menu)** बटन दिसेल, त्यावर क्लिक करून साईडबार मेनू उघडू आणि बंद करू शकता.

---

### पद्धत २: PWA (Progressive Web App) - "Add to Home Screen"
मोबाईल ॲप स्टोअरवर न जाता थेट मोबाईल स्क्रीनवर ॲप आयकॉन तयार करण्यासाठी:

1. मोबाईल ब्राउझरमध्ये वरील लिंक उघडा.
2. ब्राउझरच्या मेनूवर (उजव्या कोपऱ्यातील ३ डॉट्स `⋮` किंवा Safari चा Share आयकॉन) क्लिक करा.
3. **"Add to Home Screen" (होम स्क्रीनवर जोडा)** किंवा **"Install App"** निवडा.
4. मोबाईलच्या होम स्क्रीनवर EduManage चे ॲप आयकॉन तयार होईल.
5. ते उघडल्यास कोणत्याही ब्राउझर बारशिवाय पूर्ण स्क्रीनमध्ये (Native App सारखे) चालेल.

---

### पद्धत ३: Native Android APK तयार करणे (Capacitor द्वारे)
प्रोजेक्टमध्ये **Capacitor** आधीच कॉन्फिगर केले आहे (`com.edumanage.school`):

1. **Frontend Production Build तयार करा:**
   ```bash
   cd school-management-ui
   npm run build
   ```
2. **Capacitor मध्ये Android प्लॅटफॉर्म जोडा (पहिल्यांदा):**
   ```bash
   npx cap add android
   ```
3. **बिल्ड फाईल्स Android प्रोजेक्टमध्ये सिंक करा:**
   ```bash
   npx cap sync android
   ```
4. **Android Studio मध्ये प्रोजेक्ट उघडा:**
   ```bash
   npx cap open android
   ```
5. **Android Studio द्वारे Debug / Release APK तयार करा:**
   - `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`.
   - तयार झालेली APK फाईल कोणत्याही अँड्रॉइड मोबाईलमध्ये इन्स्टॉल करता येते.

---

## ३. सर्वसामान्य समस्या व निराकरण (Troubleshooting Runbook)

### समस्या १: `.dll` फाईल लॉक त्रुटी (File Locked / Exceeded retry count)
- **लक्षण:** `Could not copy ... The file is locked by: SchoolManagement.API`
- **कारण:** व्हिज्युअल स्टुडिओ किंवा आधीची प्रोसेस बॅकग्राउंडमध्ये चालू राहिल्यामुळे DLL फाईल लॉक होते.
- **उपाय:**
  PowerShell मध्ये खालील कमांड चालवून ती प्रोसेस बंद करा:
  ```powershell
  Stop-Process -Name "SchoolManagement.API" -Force -ErrorAction SilentlyContinue
  ```
  त्यानंतर पुन्हा `dotnet build` किंवा `dotnet run` करा.

---

### समस्या २: `SqlException: Invalid column name 'ReportsToStaffId'` (५०० एरर)
- **कारण:** डेटाबेसमधील StaffMembers टेबलमध्ये कॉलम नसणे.
- **उपाय:**
  प्रोजेक्टच्या `Program.cs` मध्ये आपोआप कॉलम जोडण्याची T-SQL सुरक्षित तपासणी जोडलेली आहे. तसेच EF Core मायग्रेशन उपलब्ध आहे:
  ```bash
  dotnet ef database update --project SchoolManagement.Data --startup-project SchoolManagement.API
  ```

---

### समस्या ३: लोगो बदलणे व दिसावे यासाठी (Logo Customization)
- नेव्हिगेशन बारमधील संस्थेच्या नावावर किंवा कॅमेरा आयकॉनवर क्लिक करा.
- **३ पर्याय उपलब्ध आहेत:**
  1. कॉम्प्युटरवरून इमेज अपलोड करा (JPG, PNG, WebP).
  2. उपलब्ध असलेल्या ४ मॉडर्न SVG आयकॉन्सपैकी एक निवडा (Graduation Cap, Modern Crest, University Shield, Academic Atom).
  3. थेट लोगोची इमेज URL प्रविष्ट करा.
- सेव्ह केल्यावर लोगो रिअल-टाईम संपूर्ण ऍप्लिकेशनमध्ये लगेच अपडेट होतो.

---

## ४. चाचणी (Automated Testing)
सर्व बॅकएंड बिझनेस लॉजिक आणि सुरक्षा तपासण्यासाठी:
```bash
dotnet test SchoolManagement.Tests/SchoolManagement.Tests.csproj
```
*(सध्या सर्व २५ ऑटोमेटेड चाचण्या १००% यशस्वीरित्या पास होतात.)*
