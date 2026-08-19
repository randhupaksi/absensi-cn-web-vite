import { appCredits } from "@/lib/config/credits";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  ArrowUpRight,
  BadgeCheck,
  Braces,
  ChevronRight,
  Code2,
  Database,
  Layers3,
  Sparkles,
  Terminal,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FaGithub, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./randhu-page.module.css";

const capabilities = [
  {
    icon: Layers3,
    label: "Product systems",
    description:
      "Mengubah alur kerja sekolah menjadi pengalaman produk yang jelas dan sesuai peran.",
  },
  {
    icon: Braces,
    label: "Frontend craft",
    description:
      "Membangun antarmuka responsif yang mengutamakan kejelasan, interaksi, dan kenyamanan penggunaan.",
  },
  {
    icon: Database,
    label: "Backend integrity",
    description:
      "Menjaga alur absensi transaksional, akses data yang aman, dan layanan yang tangguh.",
  },
] as const;

const foundations = [
  { label: "Experience", value: "UI/UX & product thinking", icon: Sparkles },
  { label: "Interface", value: "React, Vite & TypeScript", icon: Code2 },
  { label: "Tech stack", value: "Go, Gin, GORM & MySQL", icon: Terminal },
] as const;

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.04, staggerChildren: 0.07 },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.19, 1, 0.22, 1] as const },
  },
};

const footerRevealVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.19, 1, 0.22, 1] as const },
  },
};

const footerInnerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.12, staggerChildren: 0.13 },
  },
};

const footerItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, ease: [0.19, 1, 0.22, 1] as const },
  },
};

export function RandhuPage() {
  const pageRef = useRef<HTMLElement | null>(null);
  const spotlightFrameRef = useRef(0);
  const latestSpotlightRef = useRef({ x: 52, y: 22 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(spotlightFrameRef.current);
    };
  }, []);

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    latestSpotlightRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    };

    if (spotlightFrameRef.current) return;
    spotlightFrameRef.current = window.requestAnimationFrame(() => {
      const page = pageRef.current;
      const spotlight = latestSpotlightRef.current;
      if (page) {
        page.style.setProperty("--randhu-spotlight-x", `${spotlight.x}%`);
        page.style.setProperty("--randhu-spotlight-y", `${spotlight.y}%`);
      }
      spotlightFrameRef.current = 0;
    });
  }

  return (
    <main
      ref={pageRef}
      className={styles.page}
      onPointerMove={handlePointerMove}
    >
      <ThemeToggle placement="fixed" />
      <div className={styles.gridBackdrop} aria-hidden="true" />
      <div className={styles.orbOne} aria-hidden="true" />
      <div className={styles.orbTwo} aria-hidden="true" />
      <BackButton
        href="/"
        label="Kembali ke beranda"
        className="fixed left-5 top-5 z-20 sm:left-8 sm:top-7"
      />

      <section className={styles.hero}>
        <motion.div
          className={styles.heroCopy}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={heroContainerVariants}
        >
          <motion.a className={styles.eyebrow} href="/" variants={heroItemVariants}>
            <span className={styles.statusDot} />
            CITRA NEGARA ATTENDENCE SYSTEM
          </motion.a>

          <motion.p className={styles.kicker} variants={heroItemVariants}>
            The person behind the system
          </motion.p>
          <motion.h1 variants={heroItemVariants}>
            <span className={styles.nameLine}>Randhu Paksi</span>
            <span>Membumi</span>
          </motion.h1>
          <motion.p className={styles.lead} variants={heroItemVariants}>
            Solo full-stack developer yang membangun platform absensi agar
            operasional sekolah yang kompleks terasa lebih tertata, jelas, dan
            manusiawi.
          </motion.p>

          <motion.div className={styles.actions} variants={heroItemVariants}>
            <Button
              nativeButton={false}
              render={
                <a
                  href="https://id.linkedin.com/in/randhu-paksi-membumi"
                  target="_blank"
                  rel="noreferrer"
                />
              }
              className={styles.primaryAction}
            >
              <FaLinkedinIn aria-hidden="true" size={17} />
              LinkedIn profile <ArrowUpRight aria-hidden="true" size={18} />
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href="https://github.com/randhupaksi"
                  target="_blank"
                  rel="noreferrer"
                />
              }
              className={styles.secondaryAction}
            >
              <FaGithub aria-hidden="true" size={18} />
              GitHub profile
              <ArrowUpRight aria-hidden="true" size={15} />
            </Button>
          </motion.div>
        </motion.div>

        <motion.aside
          className={styles.identityPanel}
          initial={
            reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97, rotate: 1 }
          }
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.52, delay: 0.68, ease: [0.19, 1, 0.22, 1] }
          }
        >
          <div className={styles.panelChrome}>
            <span />
            <span />
            <span />
            <p>identity.json</p>
          </div>
          <div className={styles.avatarFrame}>
            <img
              className={styles.avatar}
              src="/images/randhu-paksi-membumi.jpg"
              alt="Randhu Paksi Membumi"
            />
            <div className={styles.verifiedMark}>
              <BadgeCheck aria-hidden="true" size={18} />
            </div>
          </div>
          <div className={styles.identityMeta}>
            <p>About me</p>
            <strong>{appCredits.leadCreator}</strong>
            <span>Solo Full-stack Developer</span>
          </div>
          <div className={styles.panelFooter}>
            <span>AVAILABLE FOR COLLABORATION</span>
            <span>2026</span>
          </div>
        </motion.aside>
      </section>

      <section id="craft" className={styles.craftSection}>
        <motion.div
          className={styles.sectionHeading}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55 }}
        >
          <span>01 / THE CRAFT</span>
          <h2>Dibangun untuk seluruh produk</h2>
        </motion.div>

        <div className={styles.capabilityGrid}>
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <motion.article
                key={capability.label}
                className={styles.capabilityCard}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.48, delay: index * 0.08 }}
              >
                <span className={styles.cardIndex}>0{index + 1}</span>
                <div className={styles.capabilityIcon}>
                  <Icon aria-hidden="true" size={23} />
                </div>
                <h3>{capability.label}</h3>
                <p>{capability.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="foundation" className={styles.foundationSection}>
        <motion.div
          className={styles.foundationIntro}
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
        >
          <span>02 / THE FOUNDATION</span>
          <h2>Sistem sekolah, standar produk</h2>
          <p>
            Citra Negara Attendence System dirancang sebagai sistem operasional terhubung untuk
            absensi harian-bukan sekadar kumpulan formulir yang terpisah.
          </p>
        </motion.div>

        <div className={styles.foundationList}>
          {foundations.map((foundation, index) => {
            const Icon = foundation.icon;
            return (
              <motion.div
                key={foundation.label}
                className={styles.foundationItem}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <div className={styles.foundationIcon}>
                  <Icon aria-hidden="true" size={19} />
                </div>
                <div>
                  <span>{foundation.label}</span>
                  <strong>{foundation.value}</strong>
                </div>
                <ChevronRight aria-hidden="true" size={18} />
              </motion.div>
            );
          })}
        </div>
      </section>

      <motion.footer
        className={styles.footer}
        initial="hidden"
        whileInView="visible"
        variants={footerRevealVariants}
        viewport={{ once: true, amount: 0.12 }}
      >
        <motion.div className={styles.footerInner} variants={footerInnerVariants}>
          <motion.div className={styles.footerIdentity} variants={footerItemVariants}>
            <img
              className={styles.footerMark}
              src="/images/randhu-paksi-membumi.jpg"
              alt="Randhu Paksi Membumi"
            />
            <div>
              <span className={styles.footerEyebrow}>ABOUT THE DEVELOPER</span>
              <strong>{appCredits.leadCreator}</strong>
              <p>
                Solo full-stack developer yang membangun produk digital dengan
                fokus pada clarity, usability, dan detail.
              </p>
            </div>
          </motion.div>

          <motion.div className={styles.footerExplore} variants={footerItemVariants}>
            <span className={styles.footerEyebrow}>NAVIGATION</span>
            <a href="/">Home</a>
            <a href="/login">Login</a>
            <a href="/randhu">About developer</a>
          </motion.div>

          <motion.div className={styles.footerConnect} variants={footerItemVariants}>
            <span className={styles.footerEyebrow}>LET&apos;S CONNECT</span>
            <div className={styles.footerSocials}>
              <a
                href="https://id.linkedin.com/in/randhu-paksi-membumi"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn Randhu Paksi Membumi"
              >
                <FaLinkedinIn aria-hidden="true" size={15} />
              </a>
              <a
                href="https://github.com/randhupaksi"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub Randhu Paksi Membumi"
              >
                <FaGithub aria-hidden="true" size={16} />
              </a>
              <a
                href="https://www.instagram.com/randdddh___/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram randdddh___"
              >
                <FaInstagram aria-hidden="true" size={16} />
              </a>
            </div>
            <span className={styles.footerAvailability}>
              <span /> Available for collaboration
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.footerBottom}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{
            duration: 0.5,
            delay: 0.58,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
          <span>© 2026 Randhu Paksi Membumi. All rights reserved.</span>
        </motion.div>
      </motion.footer>
    </main>
  );
}
