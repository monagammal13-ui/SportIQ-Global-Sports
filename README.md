# 🚀 SPORTIQ – Design System (Pre-Runtime Layer)


## 📖 نظرة عامة | Overview

This Design System represents the visual and UX foundation of SPORTIQ.
It operates as a pre-runtime layer and feeds into the SPORTIQ Runtime Architecture (Layers 1–200).
It does not execute business logic but provides design tokens, UI patterns, and layout standards
consumed by runtime UI and personalization engines.

---
## 🔗 Runtime Architecture Integration

This Design System is tightly integrated with the SPORTIQ Runtime Architecture.
UI components, layout rules, and design tokens defined here are dynamically consumed
by runtime layers such as Personalization, Recommendation, and Monetization engines.

This separation ensures:
- Clean separation between logic and presentation
- Runtime-driven UI personalization
- Long-term scalability and maintainability

## 📁 هيكل المشروع | Project Structure

```
HYPER-SITE-GLOBAL/
│
├── html/                    # صفحات HTML | HTML Pages
│   └── index.html          # الصفحة الرئيسية | Main Page
│
├── css/                     # ملفات التنسيق | Stylesheets
│   └── style.css           # نظام التصميم الكامل | Complete Design System
│
├── js/                      # ملفات JavaScript | JavaScript Files
│   └── main.js             # السكريبت الرئيسي | Main Script
│
├── assets/                  # الأصول | Assets
│   ├── images/             # الصور | Images
│   ├── videos/             # الفيديوهات | Videos
│   └── icons/              # الأيقونات | Icons
│
├── api-json/               # نقاط API المستقبلية | Future API Endpoints
│
└── README.md               # هذا الملف | This File
```

---

## ✨ المميزات الرئيسية | Key Features

### 🎨 نظام الألوان | Color System
- **ألوان أساسية نابضة بالحياة** باستخدام HSL للحصول على تدرجات سلسة
- **Vibrant primary colors** using HSL for smooth gradients
- تدرجات ديناميكية | Dynamic gradients
- ألوان للحالات المختلفة (نجاح، خطأ، تحذير، معلومات)
- State colors (success, error, warning, info)

### 📐 شبكة التخطيط | Grid System
- شبكة 12 عمود متجاوبة | 12-column responsive grid
- نظام فجوات مرن | Flexible gap system
- دعم كامل للأجهزة المحمولة | Full mobile support
- نقاط توقف متعددة | Multiple breakpoints

### 🔤 الطباعة | Typography
- خط **Inter** من Google Fonts
- نظام أحجام خطوط متسق | Consistent font sizing system
- أوزان خطوط متعددة (300-900) | Multiple font weights (300-900)
- ارتفاعات أسطر محسّنة | Optimized line heights

### 🧩 مكونات UI | UI Components
- **أزرار** مع تأثيرات hover ديناميكية | Buttons with dynamic hover effects
- **بطاقات** مع تأثيرات 3D عند التمرير | Cards with 3D hover effects
- **شريط التنقل** الثابت المتجاوب | Responsive sticky navigation
- **قسم البطل** مع رسوم متحركة | Hero section with animations
- **التذييل** الشامل | Comprehensive footer

### 🎭 الحركات والتأثيرات | Animations & Effects
- **Glassmorphism** للبطاقات | Glassmorphism for cards
- تأثيرات الكشف عند التمرير | Scroll reveal effects
- تحولات سلسة | Smooth transitions
- تأثيرات hover متقدمة | Advanced hover effects
- حالات التحميل والهياكل العظمية | Loading states and skeletons

### 📱 التجاوب الكامل | Full Responsiveness
- تصميم متجاوب تمامًا | Fully responsive design
- قائمة محمول منزلقة | Slide-in mobile menu
- شبكة تتكيف مع الشاشة | Screen-adaptive grid
- تحسين الأداء | Performance optimization

---

## 🚀 البدء السريع | Quick Start

### 1️⃣ فتح المشروع | Open the Project

```bash
cd "c:\Users\mody7\Downloads\HYPER- SITE-GLOBAL"
```

### 2️⃣ فتح الصفحة الرئيسية | Open the Main Page

افتح ملف `html/index.html` في متصفحك المفضل:

Open `html/index.html` in your preferred browser:

- **طريقة مباشرة** | **Direct method**: Double-click على الملف
- **خادم محلي** | **Local server** (recommended):

```bash
# باستخدام Python
python -m http.server 8000

# أو باستخدام Node.js
npx serve
```

ثم افتح | Then open: `http://localhost:8000/html/index.html`

### 3️⃣ التخصيص | Customization

يمكنك تخصيص نظام التصميم من خلال تعديل متغيرات CSS في `css/style.css`:

You can customize the design system by editing CSS variables in `css/style.css`:

```css
:root {
    --color-primary: hsl(240, 100%, 60%);     /* اللون الأساسي */
    --color-secondary: hsl(280, 90%, 60%);    /* اللون الثانوي */
    --font-family-primary: 'Inter', sans-serif; /* الخط الأساسي */
    /* ... المزيد من المتغيرات */
}
```

---

## 🎨 نظام التصميم | Design System

### الألوان | Colors

| النوع | Type | المتغير | Variable | القيمة | Value |
|------|------|---------|----------|-------|-------|
| أساسي | Primary | `--color-primary` | `hsl(240, 100%, 60%)` |
| ثانوي | Secondary | `--color-secondary` | `hsl(280, 90%, 60%)` |
| تمييز | Accent | `--color-accent` | `hsl(320, 85%, 65%)` |
| نجاح | Success | `--color-success` | `hsl(142, 71%, 45%)` |
| خطأ | Error | `--color-error` | `hsl(0, 84%, 60%)` |

### التباعد | Spacing

نظام تباعد يعتمد على 8px:
8px-based spacing system:

```css
--spacing-1: 0.5rem;   /* 8px */
--spacing-2: 1rem;     /* 16px */
--spacing-3: 1.5rem;   /* 24px */
--spacing-4: 2rem;     /* 32px */
--spacing-6: 3rem;     /* 48px */
--spacing-8: 4rem;     /* 64px */
```

### الظلال | Shadows

```css
--shadow-sm: السُّمك الخفيف | Light shadow
--shadow-md: السُّمك المتوسط | Medium shadow
--shadow-lg: السُّمك الكبير | Large shadow
--shadow-xl: السُّمك الضخم | Extra large shadow
--shadow-glow: ظل مضيء | Glow shadow
```

---

## 🛠️ الميزات التفاعلية | Interactive Features

### JavaScript المُضمّن | Included JavaScript

- ✅ **التنقل المحمول** | Mobile navigation toggle
- ✅ **الرأس الثابت** | Sticky header on scroll
- ✅ **التمرير السلس** | Smooth scrolling
- ✅ **كشف العناصر عند التمرير** | Scroll reveal animations
- ✅ **التنقل النشط** | Active navigation on scroll
- ✅ **معالجة النماذج** | Form handling with validation
- ✅ **تأثيرات البطاقات** | Card hover effects (3D tilt)
- ✅ **حالات التحميل** | Loading states & skeleton UI
- ✅ **التحميل الكسول** | Lazy loading for images
- ✅ **زر العودة للأعلى** | Back to top button

---

## 📝 استخدام المكونات | Using Components

### الأزرار | Buttons

```html
<button class="btn btn-primary">زر أساسي | Primary Button</button>
<button class="btn btn-secondary">زر ثانوي | Secondary Button</button>
<button class="btn btn-outline">زر محدد | Outline Button</button>
<button class="btn btn-primary btn-lg">زر كبير | Large Button</button>
<button class="btn btn-primary btn-sm">زر صغير | Small Button</button>
```

### البطاقات | Cards

```html
<div class="card">
    <div class="card-image"></div>
    <div class="card-body">
        <h3 class="card-title">عنوان البطاقة | Card Title</h3>
        <p class="card-text">نص البطاقة | Card text</p>
        <a href="#" class="btn btn-primary">إجراء | Action</a>
    </div>
</div>
```

### الشبكة | Grid

```html
<div class="container">
    <div class="row">
        <div class="col col-md-6 col-sm-12">العمود 1 | Column 1</div>
        <div class="col col-md-6 col-sm-12">العمود 2 | Column 2</div>
    </div>
</div>
```

---

## 🎯 أفضل الممارسات | Best Practices

### 1. استخدام متغيرات CSS | Use CSS Variables
```css
/* جيد | Good ✅ */
color: var(--color-primary);

/* سيء | Bad ❌ */
color: #6366f1;
```

### 2. الاستفادة من فئات الأدوات | Use Utility Classes
```html
<!-- جيد | Good ✅ -->
<div class="mt-4 mb-6 text-center">المحتوى | Content</div>

<!-- سيء | Bad ❌ -->
<div style="margin-top: 2rem; margin-bottom: 3rem; text-align: center;">المحتوى | Content</div>
```

### 3. التجاوب أولاً | Mobile First
```css
/* جيد | Good ✅ */
.element {
    /* Mobile styles */
}

@media (min-width: 768px) {
    .element {
        /* Tablet styles */
    }
}
```

---

## 🔧 التخصيص المتقدم | Advanced Customization

### إضافة ألوان جديدة | Adding New Colors

```css
:root {
    --color-custom: hsl(180, 70%, 50%);
    --color-custom-dark: hsl(180, 70%, 35%);
}

.btn-custom {
    background: var(--color-custom);
    color: white;
}

.btn-custom:hover {
    background: var(--color-custom-dark);
}
```

### إنشاء مكونات جديدة | Creating New Components

```css
.new-component {
    /* استخدم متغيرات النظام | Use system variables */
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-base);
}
```

---

## 🌐 الدعم متعدد اللغات | Multi-Language Support

المشروع يدعم اللغة العربية بشكل كامل:
The project fully supports Arabic (RTL):

```html
<html lang="ar" dir="rtl">
```

لتحويله للإنجليزية، غيّر إلى:
To switch to English, change to:

```html
<html lang="en" dir="ltr">
```

---

## 📊 الأداء | Performance

### التحسينات المُطبّقة | Applied Optimizations

- ✅ **Intersection Observer** للكشف عند التمرير | for scroll reveal
- ✅ **Throttling & Debouncing** لأحداث التمرير | for scroll events
- ✅ **Lazy Loading** للصور | for images
- ✅ **CSS Transform** بدلاً من position | instead of position
- ✅ **Will-change** للتأثيرات | for animations
- ✅ **Font subsetting** عبر Google Fonts

---

## 🎓 الخطوات التالية | Next Steps

### الطبقة 1: المحتوى | Layer 1: Content
- إضافة محتوى حقيقي | Add real content
- إضافة صور عالية الجودة | Add high-quality images
- إعداد قاعدة بيانات المحتوى | Setup content database

### الطبقة 2: التكامل | Layer 2: Integration
- ربط بـ API حقيقي | Connect to real API
- إضافة نظام المصادقة | Add authentication system
- تكامل CMS | CMS integration

### الطبقة 3: النشر | Layer 3: Deployment
- إعداد للنشر | Production build
- تحسين SEO | SEO optimization
- النشر على Cloudflare Pages أو Netlify

---

## 📚 الموارد | Resources

### التوثيق | Documentation
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS-Tricks](https://css-tricks.com/)
- [Web.dev](https://web.dev/)

### الأدوات | Tools
- [Google Fonts](https://fonts.google.com/)
- [Coolors](https://coolors.co/) - لوحات الألوان
- [Can I Use](https://caniuse.com/) - دعم المتصفحات

---

## 🤝 المساهمة | Contributing

نرحب بالمساهمات! يرجى:
We welcome contributions! Please:

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push للفرع
5. فتح Pull Request

---

## 📄 الترخيص | License

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.
This project is open source and available for free use.

---

## 📞 التواصل | Contact

- **Website**: [hypersight-global.com](https://hypersight-global.com)
- **Email**: info@hypersight-global.com

---

## 🎉 ملاحظات نهائية | Final Notes

تم إنشاء هذا النظام باستخدام أفضل الممارسات الحديثة في تطوير الويب:

This system was built using modern web development best practices:

✨ **Modern Design** - تصميم عصري وجذاب
🚀 **High Performance** - أداء عالي ومُحسّن
📱 **Fully Responsive** - متجاوب تماماً
♿ **Accessible** - قابل للوصول
🌍 **Global Ready** - جاهز للعالمية

---

**صُمّم بـ ❤️ بواسطة AntiGravity**

**Designed with ❤️ by AntiGravity**



