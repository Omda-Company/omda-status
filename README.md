# لوحة متابعة التحول الرقمي: بن العمدة

لوحة للإدارة بتعرض 4 حاجات: إحنا في أنهي مرحلة، واتنجز إيه وبأرقام إيه، واتصرف قد إيه مقابل المطلوب، والمطلوب منهم ومن إمتى.
**الهدف:** أي طلب فلوس أو أداة يبقى سنده قدامهم.

المحتوى بالفصحى لأنه للإدارة، ومن غير أي حاجة داخلية. التصميم في [docs/design.md](docs/design.md).

## التشغيل على الجهاز

```bash
npm install
cp .env.example .env.local   # واملا STATUS_PASSWORD وSTATUS_SECRET
npm run dev                  # http://localhost:3000
```

## النشر على Vercel

1. ارفع الفولدر ده على ريبو لوحده على GitHub.
2. **Vercel ← Add New Project** ← اختار الريبو. الـ Framework هيتعرف لوحده Next.js، ومش محتاج تغيّر أي إعداد.
3. **Settings ← Environment Variables** (لـ Production وPreview):
   - `STATUS_PASSWORD`: الباسورد اللي هيتبعت للإدارة.
   - `STATUS_SECRET`: نص عشوائي 32 حرف أو أكتر. تقدر تولّده بـ `openssl rand -hex 32`.
4. Deploy. لو المتغيرين مش موجودين، اللوحة كلها بتفضل مقفولة وبتقول "غير مهيأة".

## البيانات والتحديث

**الريبو public، فمفيهوش أي بيانات.** الإنجازات والمصروفات والسداد متخزنين في Supabase مخصوصة للعمدة، في جدول `dashboard_data` (صف `key = 'status'`). وعليه RLS من غير أي policies، فالسيرفر بس هو اللي بيقراه بالمفتاح السري.

- **النسخة اللي بتتعدّل:** `D:\Al-Omda\data\status\status.json`، برّه أي ريبو. وشكلها في [src/data/types.ts](src/data/types.ts).
- **الرفع:** `npm run push-data`. بيقرا المفتاح من `D:\Al-Omda\.env`، ويفحص الملف، ويرفعه. والتحديث بيظهر على الموقع خلال دقيقة، من غير deploy.

| لما يحصل | تعدّل في status.json |
|---|---|
| مهمة خلصت | `phases[].items[].state` ← `"done"` |
| شغل يوم جديد | يوم جديد أول `days`، وكل إنجاز معاه رقم |
| اتشترى حاجة بالدولار | سطر في `payments`، فيه التاريخ والمبلغ و**سعر الصرف يوم الشراء** |
| الشركة سددت | سطر في `reimbursements`: التاريخ، والمبلغ بالجنيه، و`from` |
| بند ميزانية اتعتمد أو اتدفع | `budget[].status` |
| طلب جديد من الإدارة، أو طلب اتنفذ | `asks` |
| مرحلة خلصت | المرحلة دي `"done"`، واللي بعدها `"active"` |
| أي تحديث | `meta.updatedAt` |

### الإعداد لأول مرة

1. مشروع Supabase للعمدة (الخطوات في `omda-ai/supabase/README.md`)، وشغّل [supabase/migrations/001_dashboard_data.sql](supabase/migrations/001_dashboard_data.sql) في SQL Editor.
2. في `D:\Al-Omda\.env`: `OMDA_SUPABASE_URL` و`OMDA_SUPABASE_SECRET_KEY`.
3. في Vercel: `SUPABASE_URL` و`SUPABASE_SECRET_KEY` و`CRON_SECRET`، وبعدين Redeploy.
4. `npm run push-data`.

**Supabase المجاني بيقف لوحده بعد أسبوع من غير نشاط.** عشان كده Vercel بيبعت طلب لـ `/api/keepalive` كل يوم الساعة 6 الصبح (`vercel.json`)، والطلب محمي بـ `CRON_SECRET`.

## الحماية

- **باسورد واحد:** الكوكي فيها بصمة من الباسورد والسر، مش الباسورد نفسه. ولو غيّرت الباسورد، كل الناس يطلبوه تاني.
- **مش بتظهر في جوجل:** `noindex` و`robots` بيمنعوا الفهرسة.
- **صلاحية الدخول:** الكوكي `httpOnly` وصلاحيتها 30 يوم.
