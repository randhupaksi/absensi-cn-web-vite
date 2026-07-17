import { AppImage as Image } from "@/components/media/app-image";
import { AppLink as Link } from "@/components/router/app-link";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaBriefcase,
  FaBullhorn,
  FaCameraRetro,
  FaCheckCircle,
  FaClock,
  FaCode,
  FaConciergeBell,
  FaGlobe,
  FaGraduationCap,
  FaHeartbeat,
  FaInstagram,
  FaNetworkWired,
  FaSchool,
  FaShieldAlt,
  FaStar,
  FaWhatsapp,
  FaWifi,
} from "react-icons/fa";
import { TestimonialsCarousel } from "@/features/landing/components/testimonials-carousel";
import styles from "./home-page.module.css";

const highlightChips = [
  "Absensi Foto",
  "Validasi Walas",
  "Pantauan BK",
  "Dashboard Admin",
  "Riwayat Live",
  "Data Terpadu",
];

const excellencePoints = [
  "Fitur absensi waktu nyata",
  "Waktu absensi terjadwal",
  "Siap untuk manajemen sekolah",
  "Bimbingan siswa yang baik dan terarah",
];

const majors = [
  {
    name: "PPLG",
    label: "Teknologi",
    detail: "Pemrograman dan software modern",
  },
  {
    name: "DKV",
    label: "Kreatif",
    detail: "Visual branding dan multimedia",
  },
  {
    name: "TJKT",
    label: "Jaringan",
    detail: "Komputer, server, dan konektivitas",
  },
  {
    name: "Pemasaran",
    label: "Bisnis",
    detail: "Strategi promosi dan layanan pelanggan",
  },
  {
    name: "MPLB",
    label: "Manajemen",
    detail: "Administrasi kantor yang terstruktur",
  },
  {
    name: "Perhotelan",
    label: "Hospitality",
    detail: "Etika layanan dan kesiapan industri",
  },
];

const majorIcons = {
  PPLG: FaCode,
  DKV: FaCameraRetro,
  TJKT: FaNetworkWired,
  Pemasaran: FaBullhorn,
  MPLB: FaBriefcase,
  Perhotelan: FaConciergeBell,
} as const;

const majorImages = {
  PPLG: "/images/raw/pplg.jpeg",
  DKV: "/images/raw/dkv.jpeg",
  TJKT: "/images/raw/tjkt.jpeg",
  Pemasaran: "/images/raw/pm.jpeg",
  MPLB: "/images/raw/mplb.jpeg",
  Perhotelan: "/images/raw/ph.jpeg",
} as const;

const majorImagePositions = {
  PPLG: "object-[50%_center]",
  DKV: "object-[54%_center]",
  TJKT: "object-[57%_center]",
  Pemasaran: "object-[50%_center]",
  MPLB: "object-[58%_center]",
  Perhotelan: "object-[50%_center]",
} as const;

const contactLinks = [
  { icon: FaGlobe, label: "Website", href: "https://smk.citranegara.sch.id/" },
  { icon: FaInstagram, label: "Instagram", href: "https://www.instagram.com/smkcitranegaradepok/" },
  { icon: FaWhatsapp, label: "WhatsApp", href: "https://wa.me/622177201052" },
] as const;

const testimonials = [
  {
    name: "Randhu",
    role: "XI DKV 1",
    body: "Tampilan aplikasinya enak dipakai dan proses absensi jadi cepat. Saat datang ke sekolah, saya langsung tahu status kehadiran tanpa bingung atau antre lama.",
  },
  {
    name: "Alya",
    role: "XI PPLG 2",
    body: "Bagian dashboard terasa modern dan rapi. Informasi kehadiran, keterlambatan, dan catatan sekolah bisa dilihat dengan jelas dari satu tempat.",
  },
  {
    name: "Nadira",
    role: "X MPLB 1",
    body: "Aplikasi ini bikin komunikasi kehadiran lebih tertata. Saya suka karena tampilannya simpel, responsif di HP, dan tetap terasa premium saat dipakai.",
  },
  {
    name: "Fikri",
    role: "X TJKT 2",
    body: "Proses absen masuk terasa cepat dan tampilannya mudah dipahami. Notifikasi status hadir juga membantu saya lebih disiplin setiap pagi.",
  },
  {
    name: "Keisha",
    role: "XII PM 1",
    body: "Saya suka karena data kehadiran langsung terlihat jelas. Untuk tugas sekolah seperti ini, tampilannya sudah rapi dan terasa profesional.",
  },
  {
    name: "Rama",
    role: "XI MPLB 2",
    body: "Penggunaan aplikasinya ringan di laptop maupun HP. Riwayat absensi jadi lebih mudah dicek tanpa harus tanya ulang ke guru.",
  },
  {
    name: "Citra",
    role: "X DKV 2",
    body: "Desainnya bersih dan enak dilihat. Saya paling suka bagian review dan informasi utama karena langsung terbaca tanpa bikin bingung.",
  },
  {
    name: "Bagas",
    role: "XII PPLG 1",
    body: "Absensi digital seperti ini lebih praktis dibanding manual. Semua data terasa lebih modern dan cocok buat kebutuhan sekolah sekarang.",
  },
  {
    name: "Nabila",
    role: "XI PM 2",
    body: "Halaman aplikasinya nyaman dipakai dan transisinya halus. Dari sisi pengguna, semuanya terasa lebih cepat dan tertata.",
  },
  {
    name: "Dimas",
    role: "X TJKT 1",
    body: "Saya bisa langsung paham alur aplikasinya sejak pertama buka. Ini membantu siswa supaya tidak kesulitan saat melakukan absensi harian.",
  },
  {
    name: "Salma",
    role: "XII MPLB 2",
    body: "Warna, tata letak, dan informasi pentingnya sudah pas. Aplikasi ini terasa siap dipakai untuk presentasi maupun penggunaan sekolah.",
  },
  {
    name: "Arkan",
    role: "XI PPLG 3",
    body: "Menurut saya ini salah satu bagian yang paling menarik dari project-nya. Review card dan section jurusan sekarang terasa lebih hidup.",
  },
];

export default function HomePage() {
  return (
    <main className={`${styles.landingPage} min-h-screen`}>
      <section className="w-full">
        <div className="space-y-7 pb-0">
          <div className={`${styles.landingHeroShell} relative overflow-hidden`}>
            <div className={`${styles.landingHeroViewport} relative overflow-hidden`}>
              <Image
                src="/images/optimized/cn-hero.jpg"
                srcSet="/images/optimized/cn-panel.jpg 960w, /images/optimized/cn-hero.jpg 1920w"
                alt="Gedung Sekolah Citra Negara"
                fill
                priority
                sizes="100vw"
                className={`${styles.landingHeroImage} object-cover`}
              />
              <div className={`${styles.landingHeroOverlay} ${styles.landingOverlayReveal} absolute inset-0`} />
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-emerald-950/70 via-emerald-950/18 to-transparent" />
              <div className={`${styles.landingHeroViewport} relative z-10 mx-auto flex w-full max-w-[1480px] items-center px-6 py-16 md:px-10 xl:px-14`}>
                <div className="mx-auto max-w-[960px] space-y-6 text-center">
                  <div className={`${styles.landingReveal} inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-100 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl`}>
                    <FaCameraRetro className="size-3.5 text-emerald-300" />
                    Portal Absensi Real Time
                  </div>

                  <div className="space-y-4">
                    <p className={`${styles.landingReveal} ${styles.landingDelayOne} font-heading text-[1.25rem] font-semibold italic text-white/88 md:text-[1.6rem]`}>
                      Sekolah Citra Negara Attendance System
                    </p>
                    <h1 className={`${styles.landingReveal} ${styles.landingDelayTwo} font-heading text-[2.8rem] font-bold leading-[0.96] tracking-[-0.07em] text-white drop-shadow-[0_14px_30px_rgba(0,0,0,0.28)] md:text-[4.7rem] xl:text-[5.6rem]`}>
                      Absensi pagi tanpa antre.
                      <span className={`${styles.landingHeroTitle} block`}>Cukup foto, data langsung masuk.</span>
                    </h1>
                    <p className={`${styles.landingReveal} ${styles.landingDelayThree} mx-auto max-w-[760px] text-base font-medium leading-8 text-white/82 md:text-[1.18rem]`}>
                      Siswa absen masuk dari kamera, wali kelas memvalidasi, BK memantau
                      prioritas, dan admin melihat rekap secara real-time.
                    </p>
                  </div>

                  <div className={`${styles.landingReveal} ${styles.landingDelayFour} flex justify-center`}>
                    <Link
                      href="/login/student"
                      className={`${styles.landingCtaButton} group inline-flex h-14 items-center justify-center gap-3 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-emerald-50`}
                    >
                      Mulai Absensi Sekarang
                      <FaArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.landingPageShell} mx-auto w-full max-w-[1480px] md:px-6 xl:px-10`}>
            <div className="px-5 py-7 md:px-8 md:py-9 xl:px-10">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {highlightChips.map((chip, index) => (
                  <div
                    key={chip}
                    className={`${styles.landingChip} ${styles.landingReveal} flex items-center gap-2 px-4 py-3 text-sm font-medium`}
                    style={{ animationDelay: `${980 + index * 70}ms` }}
                  >
                    <span className={`${styles.landingChipIcon} flex size-7 shrink-0 items-center justify-center rounded-full`}>
                      {index === 0 ? (
                        <FaShieldAlt className="size-3.5" />
                      ) : index === 1 ? (
                        <FaWifi className="size-3.5" />
                      ) : index === 2 ? (
                        <FaHeartbeat className="size-3.5" />
                      ) : index === 3 ? (
                        <FaClock className="size-3.5" />
                      ) : (
                        <FaCheckCircle className="size-3.5" />
                      )}
                    </span>
                    <span>{chip}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 grid items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] xl:gap-12">
                <div className={`${styles.landingRevealLeft} relative mx-auto w-full max-w-[420px]`}>
                  <div className={`${styles.landingPanelImage} relative h-[320px] overflow-hidden`}>
                    <Image
                      src="/images/optimized/side-look-cn-panel.jpg"
                      alt="Area Sekolah Citra Negara"
                      fill
                      sizes="(min-width: 1024px) 420px, 92vw"
                      className="object-cover object-left"
                    />
                    <div className={`${styles.landingImageSoftOverlay} absolute inset-0`} />
                  </div>

                  <div className={`${styles.landingFloatCard} ${styles.landingFloatReveal} absolute bottom-5 right-[-6px] px-4 py-3`}>
                    <div className="flex items-center gap-3">
                      <span className={`${styles.landingAccentText} flex size-9 items-center justify-center rounded-full bg-emerald-50`}>
                        <FaSchool className="size-4" />
                      </span>
                      <div>
                        <p className={`${styles.landingAccentStrong} text-sm font-bold`}>Sekolah</p>
                        <p className={`${styles.landingAccentStrong} text-sm font-bold`}>Unggulan</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${styles.landingRevealRight} space-y-5`}>
                  <div className="space-y-3">
                    <h2 className={`${styles.landingInkText} font-heading text-3xl font-bold tracking-tight md:text-[2.8rem]`}>
                      Keistimewaan Aplikasi
                      <br />
                      Absensi Sekolah Citra Negara
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {excellencePoints.map((point, index) => (
                      <div
                        key={point}
                        className={`${styles.landingReveal} flex items-start gap-3`}
                        style={{ animationDelay: `${1240 + index * 90}ms` }}
                      >
                        <span className={`${styles.landingAccentText} mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50`}>
                          {index === 0 ? (
                            <FaHeartbeat className="size-4" />
                          ) : index === 1 ? (
                            <FaClock className="size-4" />
                          ) : index === 2 ? (
                            <FaGraduationCap className="size-4" />
                          ) : (
                            <FaCheckCircle className="size-4" />
                          )}
                        </span>
                        <p className={`${styles.landingMutedText} pt-1 text-base font-medium md:text-lg`}>
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 px-2 py-4 md:px-4 md:py-5 xl:px-6">
              <div className={`${styles.landingReveal} text-center`}>
                <div className={`${styles.landingMajorBadge} inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]`}>
                  <FaStar className="size-3.5" />
                  Jurusan Unggulan
                </div>
                <h2 className={`${styles.landingInkText} mt-4 text-[1.75rem] font-bold tracking-tight md:text-[2.25rem]`}>
                  Jurusan yang Terpantau Sistem
                </h2>
                <p className={`${styles.landingMutedText} mx-auto mt-3 max-w-[620px] text-sm leading-7 md:text-base`}>
                  Setiap jurusan dipresentasikan dengan sistem yang lebih
                  modern, kontras, dan interaktif agar terasa premium saat dilihat.
                </p>
              </div>

              <div className="mx-auto mt-10 grid max-w-[1280px] gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {majors.map((major, index) => (
                  (() => {
                    const MajorIcon = majorIcons[major.name as keyof typeof majorIcons] as IconType;
                    const majorImage = majorImages[major.name as keyof typeof majorImages];
                    const majorImagePosition =
                      majorImagePositions[major.name as keyof typeof majorImagePositions];

                    return (
                  <article
                    key={major.name}
                    className={`${styles.landingMajorCard} ${styles.landingReveal} group relative mx-auto w-full max-w-[310px] overflow-hidden transition duration-500 hover:-translate-y-2`}
                    style={{ animationDelay: `${1420 + index * 85}ms` }}
                  >
                    <div className="relative h-[340px]">
                      <Image
                        src={majorImage}
                        alt={`Jurusan ${major.name} di Sekolah Citra Negara`}
                        fill
                        sizes="(min-width: 1024px) 310px, (min-width: 640px) 45vw, 86vw"
                        className={`object-cover ${majorImagePosition} transition duration-700 group-hover:scale-110 group-hover:rotate-[0.6deg]`}
                      />
                      <div className={`${styles.landingMajorOverlay} absolute inset-0`} />
                      <div className="absolute inset-x-0 top-0 p-4">
                        <div className="flex items-center justify-between">
                          <span className={`${styles.landingMajorTopBadge} inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]`}>
                            {major.label}
                          </span>
                          <span className={`${styles.landingMajorIconBadge} inline-flex size-10 items-center justify-center rounded-full transition duration-300 group-hover:bg-emerald-500/85`}>
                            <MajorIcon className="size-4" />
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className={`${styles.landingMajorPanel} px-5 py-4`}>
                          <p className="text-left text-[1.28rem] font-semibold tracking-tight text-white">
                            {major.name}
                          </p>
                          <p className="mt-1 text-left text-[12px] leading-6 text-white/72">
                            {major.detail}
                          </p>
                        </div>
                      </div>
                      <div className={`${styles.landingMajorDivider} pointer-events-none absolute inset-x-6 bottom-[92px] h-px`} />
                    </div>
                  </article>
                    );
                  })()
                ))}
              </div>
            </div>

            {false ? (
              <div className={`${styles.landingReviewSection} ${styles.landingReveal} mt-8 px-6 py-7 md:px-8 md:py-8 xl:px-12`}>
                <TestimonialsCarousel testimonials={testimonials} />
              </div>
            ) : null}

            <div className="mt-8 px-2 md:px-4 xl:px-6">
              <div className={`${styles.landingCtaShell} ${styles.landingReveal} relative overflow-hidden rounded-[42px] px-6 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12`}>
                <div className={`${styles.landingCtaGlow} absolute inset-0`} />
                <div className="absolute right-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-emerald-300/12 blur-3xl" />
                <div className="absolute bottom-[-90px] left-[46%] h-[220px] w-[220px] rounded-full bg-teal-200/10 blur-3xl" />

                <div className="relative grid items-center gap-8 lg:grid-cols-[0.86fr_1.14fr]">
                  <div className={`${styles.landingRevealLeft} relative mx-auto w-full max-w-[390px]`}>
                    <div className={`${styles.landingCtaImageFrame} absolute -left-4 -top-4 h-24 w-24 rounded-[28px]`} />
                    <div className={`${styles.landingCtaImageFrame} absolute -bottom-4 -right-4 h-24 w-24 rounded-[28px]`} />
                    <div className="absolute -bottom-5 -right-5 h-28 w-28 rounded-full bg-emerald-300/18 blur-2xl" />
                    <div className={`${styles.landingCtaImage} relative h-[220px] overflow-hidden md:h-[278px]`}>
                      <Image
                        src="/images/optimized/coridor-cn-panel.jpg"
                        alt="Area sekolah untuk akses aplikasi absensi"
                        fill
                        sizes="(min-width: 1024px) 390px, 92vw"
                        className="object-cover object-center transition duration-700 hover:scale-105"
                      />
                      <div className={`${styles.landingCtaImageOverlay} absolute inset-0`} />
                    </div>
                  </div>

                  <div className={`${styles.landingRevealRight} relative max-w-[640px]`}>
                    <div className={`${styles.landingCtaBadge} inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]`}>
                      Portal Absensi
                    </div>
                    <h2 className="mt-5 max-w-[580px] text-[2rem] font-bold leading-[1.06] tracking-tight text-white md:text-[3.2rem]">
                      Lakukan Absensi Atau
                      <br />
                      Manajemen Absensi Siswa Di Sini
                    </h2>
                    <p className="mt-4 max-w-[500px] text-sm leading-7 text-white/80 md:text-base">
                      Silahkan login untuk melakukan tugas sesuai keinginan Anda
                      dengan pengalaman yang lebih cepat, rapi, dan terintegrasi.
                    </p>

                    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <Link
                        href="/login/student"
                        className={`${styles.landingCtaButton} group inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5`}
                      >
                        Masuk Siswa
                        <FaArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                      </Link>
                      <Link
                        href="/login/staff"
                        className="group inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-emerald-200/35 hover:bg-white/16"
                      >
                        <FaShieldAlt className="size-4 text-emerald-200 transition group-hover:scale-105" />
                        Portal Staff
                      </Link>
                      <div className={`${styles.landingCtaPill} inline-flex w-fit items-center gap-3 whitespace-nowrap rounded-full px-4 py-3 text-sm`}>
                        <span className={`${styles.landingCtaPillIcon} flex size-8 items-center justify-center rounded-full`}>
                          <FaCheckCircle className="size-4" />
                        </span>
                        Siap untuk siswa, walas, BK, dan admin
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={`${styles.landingFooterShell} ${styles.landingReveal} relative mt-0 overflow-hidden px-4 pb-8 pt-10 text-white sm:px-6 md:px-8 md:pb-10 md:pt-18`}>
        <div className="absolute left-[8%] top-12 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[10%] top-16 h-28 w-28 rounded-full bg-teal-300/8 blur-3xl" />
        <div className="mx-auto max-w-[1480px]">
          <div className={`${styles.landingFooterGlass} grid gap-8 rounded-[28px] px-6 py-8 sm:px-8 sm:py-10 md:rounded-b-[36px] lg:grid-cols-[1.1fr_0.9fr_0.8fr] lg:items-start`}>
            <div>
              <div className="inline-flex items-center gap-3">
                <div className={`${styles.landingFooterBrandBadge} flex size-11 shrink-0 items-center justify-center rounded-2xl sm:size-12`}>
                  <FaSchool className="size-5" />
                </div>
                <div>
                  <p className={`${styles.landingFooterKicker} text-[10px] font-semibold uppercase tracking-[0.26em] sm:text-xs sm:tracking-[0.28em]`}>
                    Absensi Siswa
                  </p>
                  <h3 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                    SEKOLAH CITRA NEGARA
                  </h3>
                </div>
              </div>
              <p className="mt-5 max-w-[360px] text-sm leading-7 text-white/68">
                Platform absensi sekolah yang dirancang untuk membantu proses
                hadir, monitoring, dan manajemen siswa secara lebih modern.
              </p>
            </div>

            <div>
              <p className={`${styles.landingFooterKicker} text-xs font-semibold uppercase tracking-[0.24em] sm:text-sm`}>
                Nilai Utama
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  "Absensi real-time dan terjadwal",
                  "Siap dipakai multi peran sekolah",
                  "Desain bersih, cepat, dan terintegrasi",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/72">
                    <span className={`${styles.landingFooterCheck} flex size-6 shrink-0 items-center justify-center rounded-full`}>
                      <FaCheckCircle className="size-3.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={`${styles.landingFooterKicker} text-xs font-semibold uppercase tracking-[0.24em] sm:text-sm`}>
                Hubungi
              </p>
              <div className="mt-5 flex items-center gap-3">
                {contactLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.landingFooterContact} inline-flex size-11 items-center justify-center rounded-2xl transition hover:-translate-y-0.5`}
                  >
                    <Icon className="size-4.5" />
                  </a>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-white/62">
                Pilihan yang tepat di sekolah
                <br />
                yang M.A.N.T.A.P
              </p>
            </div>
          </div>

          <div className="mt-7 border-t border-white/10 pt-5 text-center text-xs leading-6 text-white/56 sm:mt-8 sm:pt-6 sm:text-sm">
            <p>2026@ SEKOLAH CITRA NEGARA ALL RIGHT RESERVED</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
