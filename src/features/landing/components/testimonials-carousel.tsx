"use client";

import { useState, startTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FaChevronLeft, FaChevronRight, FaQuoteRight } from "react-icons/fa";
import styles from "./testimonials-carousel.module.css";

type Testimonial = {
  name: string;
  role: string;
  body: string;
};

type TestimonialsCarouselProps = {
  testimonials: Testimonial[];
};

export function TestimonialsCarousel({
  testimonials,
}: TestimonialsCarouselProps) {
  const [index, setIndex] = useState(0);
  const visibleCount = Math.min(3, testimonials.length);

  const goToPrevious = () => {
    startTransition(() => {
      setIndex((current) =>
        current === 0 ? testimonials.length - 1 : current - 1,
      );
    });
  };

  const goToNext = () => {
    startTransition(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    });
  };

  const visibleTestimonials = Array.from({ length: visibleCount }, (_, offset) => {
    return testimonials[(index + offset) % testimonials.length];
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.36fr_0.64fr] lg:items-start xl:grid-cols-[0.34fr_0.66fr]">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className={`${styles.landingAccentText} text-[11px] font-semibold uppercase tracking-[0.34em]`}>
            Penilaian
          </p>
          <h3 className={`${styles.landingInkText} max-w-[420px] text-[2.1rem] font-bold leading-[1.08] tracking-[-0.04em] md:text-[3.05rem]`}>
            Yang Dikatakan
            <br />
            <span className={`${styles.landingAccentText} inline-block pr-1`}>
              Murid
            </span>
            <br />
            Tentang Aplikasi Ini
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Testimoni sebelumnya"
            className={`${styles.landingReviewNav} group inline-flex size-10 items-center justify-center rounded-full transition hover:-translate-y-0.5`}
          >
            <FaChevronLeft className="size-4.5 transition group-hover:-translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Testimoni berikutnya"
            className={`${styles.landingReviewNav} group inline-flex size-10 items-center justify-center rounded-full transition hover:-translate-y-0.5`}
          >
            <FaChevronRight className="size-4.5 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleTestimonials.map((testimonial) => (
            <article
              key={`${index}-${testimonial.name}-${testimonial.role}`}
              className={`${styles.landingReviewCard} relative min-h-[190px] overflow-hidden p-4`}
            >
              <div className={`${styles.landingReviewQuote} absolute right-4 top-4 rounded-full p-1.5`}>
                <FaQuoteRight className="size-3.5" />
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`${styles.landingAvatarBadge} flex size-9 items-center justify-center rounded-full text-xs font-bold`}>
                  {testimonial.name
                    .split(" ")
                    .map((segment) => segment[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className={`${styles.landingInkText} text-[12px] font-bold`}>{testimonial.name}</p>
                  <p className={`${styles.landingAccentText} text-[10px] font-semibold uppercase tracking-[0.16em]`}>
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <p className={`${styles.landingMutedText} mt-4 text-[12px] leading-7`}>
                {testimonial.body}
              </p>
            </article>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
