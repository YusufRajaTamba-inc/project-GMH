import { db } from '../config/db.js';

async function fixMemberData() {
  console.log('Fixing member data in PostgreSQL...');
  
  // 1. Set wedding_date to NULL for single members:
  // Yusuf Panjaitan: Menikah (keep wedding date)
  // Mariana Hutabarat: Lajang (NULL)
  // Jekson Simanjuntak: Menikah (keep wedding date)
  // Debora Sinaga: Lajang (NULL)
  // Antonius Saragih: Menikah (keep wedding date)
  // Grace Silalahi: Lajang (NULL)
  // Ronald Manullang: Menikah (keep wedding date)
  // Yusuf Tamba: Lajang (NULL)
  // Togar Pardede: Lajang (NULL)

  await db.query(`
    UPDATE members 
    SET wedding_date = NULL
    WHERE full_name IN ('Mariana Hutabarat', 'Debora Sinaga', 'Grace Silalahi', 'Yusuf Tamba', 'Togar Pardede')
  `);

  // 2. Populate detailed residence address, birth place, and social media in custom_fields
  const memberDetails = [
    {
      name: 'Yusuf Panjaitan',
      birth_place: 'Medan',
      birth_date: '1996-04-12',
      marital_status: 'Menikah',
      wedding_date: '2023-08-12',
      home_address: 'Kompleks USU Blok D No. 12, Jl. Dr. Mansyur, Kel. Padang Bulan, Kec. Medan Baru',
      city: 'Medan',
      province: 'Sumatera Utara',
      postal_code: '20155',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/yusuf-panjaitan',
        instagram: '@yusufpanjaitan',
        facebook: 'Yusuf Panjaitan',
      }
    },
    {
      name: 'Mariana Hutabarat',
      birth_place: 'Tarutung',
      birth_date: '1998-09-24',
      marital_status: 'Lajang',
      wedding_date: null,
      home_address: 'Apartemen Kalibata City Tower Borneo Lt. 8, Pancoran',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12750',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/marianahutabarat',
        instagram: '@mariana.huta',
        facebook: 'Mariana Hutabarat',
      }
    },
    {
      name: 'Jekson Simanjuntak',
      birth_place: 'Balige',
      birth_date: '1995-11-05',
      marital_status: 'Menikah',
      wedding_date: '2022-11-20',
      home_address: 'Jl. Raya Darmo Permai III No. 88, Dukuh Pakis',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postal_code: '60226',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/dr-jekson-simanjuntak',
        instagram: '@dr.jekson',
      }
    },
    {
      name: 'Debora Sinaga',
      birth_place: 'Pematangsiantar',
      birth_date: '1999-07-18',
      marital_status: 'Lajang',
      wedding_date: null,
      home_address: 'Jl. Dago Asri No. 15A, Coblong',
      city: 'Bandung',
      province: 'Jawa Barat',
      postal_code: '40135',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/deborasinaga-sh',
        instagram: '@debora_sinaga',
      }
    },
    {
      name: 'Antonius Saragih',
      birth_place: 'Kabanjahe',
      birth_date: '1997-03-30',
      marital_status: 'Menikah',
      wedding_date: '2024-05-18',
      home_address: 'Jl. Jamin Ginting Km. 11,5 No. 42, Simpang Selayang',
      city: 'Medan',
      province: 'Sumatera Utara',
      postal_code: '20135',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/antonius-saragih',
        instagram: '@antonsaragih',
      }
    },
    {
      name: 'Grace Silalahi',
      birth_place: 'Medan',
      birth_date: '2000-02-15',
      marital_status: 'Lajang',
      wedding_date: null,
      home_address: 'Jl. Setia Budi Pasar 2 No. 8, Medan Selayang',
      city: 'Medan',
      province: 'Sumatera Utara',
      postal_code: '20132',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/grace-silalahi',
        instagram: '@gracesilalahi_',
      }
    },
    {
      name: 'Ronald Manullang',
      birth_place: 'Sidikalang',
      birth_date: '1994-08-10',
      marital_status: 'Menikah',
      wedding_date: '2021-02-14',
      home_address: 'Jl. Tebet Barat Dalam Raya No. 27, Tebet',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12810',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/ronald-manullang-st',
        instagram: '@ronaldmanullang',
      }
    },
    {
      name: 'Yusuf Tamba',
      birth_place: 'Pangururan',
      birth_date: '2000-10-15',
      marital_status: 'Lajang',
      wedding_date: null,
      home_address: 'Jl. Pintu Air IV Gg. Bersama No. 5, Kwala Bekala',
      city: 'Medan',
      province: 'Sumatera Utara',
      postal_code: '20142',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/yusuftamba',
        instagram: '@yusuf_tamba',
      }
    },
    {
      name: 'Togar Pardede',
      birth_place: 'Balige',
      birth_date: '1999-12-31',
      marital_status: 'Lajang',
      wedding_date: null,
      home_address: 'Jl. Karya Wisata Kompleks JBC No. 3, Medan Johor',
      city: 'Medan',
      province: 'Sumatera Utara',
      postal_code: '20144',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/togarpardede',
        instagram: '@togarpardede',
      }
    },
  ];

  for (const m of memberDetails) {
    await db.query(`
      UPDATE members SET
        birth_place = $1,
        birth_date = $2,
        wedding_date = $3,
        home_address = $4,
        city = $5,
        province = $6,
        postal_code = $7,
        custom_fields = jsonb_set(
          COALESCE(custom_fields, '{}'::jsonb),
          '{socialMedia}',
          $8::jsonb
        )
      WHERE full_name = $9
    `, [
      m.birth_place,
      m.birth_date,
      m.wedding_date,
      m.home_address,
      m.city,
      m.province,
      m.postal_code,
      JSON.stringify(m.socialMedia),
      m.name
    ]);
  }

  // Also ensure alumni_profiles has graduation_year and ktb_group_name populated
  await db.query(`
    UPDATE alumni_profiles SET
      graduation_year = entry_year + 4,
      ktb_group_name = CASE 
        WHEN faculty = 'Fakultas Teknik' THEN 'KTB Paulus'
        WHEN faculty = 'Fakultas MIPA' THEN 'KTB Ester'
        WHEN faculty = 'Fakultas Kedokteran' THEN 'KTB Timotius'
        WHEN faculty = 'Fakultas Hukum' THEN 'KTB Rut'
        WHEN faculty = 'Fakultas Pertanian' THEN 'KTB Barnabas'
        WHEN faculty = 'Fakultas Ekonomi & Bisnis' THEN 'KTB Maria'
        ELSE 'KTB Alumni PA KMK'
      END
  `);

  console.log('✅ Member data updated successfully!');
  process.exit(0);
}

fixMemberData().catch(e => {
  console.error(e);
  process.exit(1);
});
