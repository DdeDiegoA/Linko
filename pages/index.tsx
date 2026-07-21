import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { InView } from '@/components/animate-ui/effects/in-view';
import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';
import { AnimateButton } from '@/components/animate-ui/buttons/button';
import { Accordion } from '@/components/animate-ui/components/accordion';
import styles from './landing.module.css';

const FAQ_ITEMS = [
  { q: '¿Necesito saber programar?', a: 'No. Linko se crea desde el navegador. Elige tu nombre, sube una foto, agrega links y listo.' },
  { q: '¿Es gratis?', a: 'Sí. La versión base es gratuita y sin límites de links. En el futuro habrá funciones premium opcionales.' },
  { q: '¿Puedo usar mi propio dominio?', a: 'En la versión gratuita tienes un link tipo linko.tu/usuario. El dominio propio llegará pronto.' },
  { q: '¿Quién ve mis analíticas?', a: 'Solo tú. No vendemos datos ni mostramos publicidad basada en tu tráfico.' },
];

const Home: NextPage = () => {
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const SignupForm = () => (
    <form className={styles.heroForm} onSubmit={handleFormSubmit}>
      <input
        type="text"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={styles.heroInput}
        placeholder="tuusuario"
        aria-label="Nombre de usuario"
      />
      <AnimateButton type="submit" className={styles.heroBtn}>Crear página</AnimateButton>
      {submitted && <div className={styles.formSuccess} role="status">¡Listo! Te contactaremos pronto.</div>}
    </form>
  );

  return (
    <>
      <Head>
        <title>Linko — Tu link, sin ruido.</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Link-in-bio para tu círculo. Todo lo que creas, compartes y vendes. En un solo lugar." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`} id="nav">
        <div className={styles.container + ' ' + styles.navInner}>
          <a href="/" className={styles.navLogo}>Linko</a>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#como">Cómo funciona</a>
            <a href="#faq">FAQ</a>
            <motion.a
              href="/dashboard"
              className={styles.navCta}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              Crear página
            </motion.a>
          </div>
        </div>
      </nav>

      <section className={styles.hero} id="hero">
        <motion.div
          className={styles.heroLeft}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.heroLabel}>Link-in-bio para tu círculo</span>
          <h1 className={styles.heroH1}>Tu link,<br />sin ruido.</h1>
          <p className={styles.heroBody}>Todo lo que creas, compartes y vendes. En un solo lugar. Sin marca ajena, sin distracciones.</p>
          <SignupForm />
          <div className={styles.heroTrust}>
            <div className={styles.heroTrustDots}>
              <span></span><span></span><span></span>
            </div>
            <span>Gratis. Sin tarjeta de crédito.</span>
          </div>
        </motion.div>

        <div className={styles.heroRight} aria-hidden="true">
          <div className={styles.heroTower}>
            {[1, 2].map((set) => (
              <div key={set}>
                <div className={styles.profileCard}>
                  <div className={styles.profileCardHeader}>
                    <div className={styles.profileAvatar} style={{ background: 'var(--lavender)' }}></div>
                    <div>
                      <div className={styles.profileName}>Maru López</div>
                      <div className={styles.profileHandle}>@maru.creates</div>
                    </div>
                  </div>
                  <div className={styles.profileLink}>Portafolio</div>
                  <div className={styles.profileLink}>Tienda</div>
                </div>
                <div className={styles.profileCard}>
                  <div className={styles.profileCardHeader}>
                    <div className={styles.profileAvatar} style={{ background: '#c4a8e0' }}></div>
                    <div>
                      <div className={styles.profileName}>Club de Lectura</div>
                      <div className={styles.profileHandle}>@lecturas.mensuales</div>
                    </div>
                  </div>
                  <div className={styles.profileLink}>Próxima reunión</div>
                  <div className={styles.profileLink}>Libros del mes</div>
                  <div className={styles.profileLink}>Únete</div>
                </div>
                <div className={styles.profileCard}>
                  <div className={styles.profileCardHeader}>
                    <div className={styles.profileAvatar} style={{ background: '#8ec5fc' }}></div>
                    <div>
                      <div className={styles.profileName}>Nico Torres</div>
                      <div className={styles.profileHandle}>@nicotorres.dev</div>
                    </div>
                  </div>
                  <div className={styles.profileLink}>Blog</div>
                  <div className={styles.profileLink}>GitHub</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.trust}>
        <div className={styles.container + ' ' + styles.trustInner}>
          <InView className={styles.trustItem} delay={0}>
            <div className={styles.trustNum}><SlidingNumber value={30} />s</div>
            <div className={styles.trustLabel}>Para crear tu página</div>
          </InView>
          <InView className={styles.trustItem} delay={0.1}>
            <div className={styles.trustNum}><SlidingNumber value={0} /></div>
            <div className={styles.trustLabel}>Líneas de código</div>
          </InView>
          <InView className={styles.trustItem} delay={0.2}>
            <div className={styles.trustNum}><SlidingNumber value={100} />%</div>
            <div className={styles.trustLabel}>Tuyo — sin marca ajena</div>
          </InView>
        </div>
      </section>

      <section className={styles.features} id="features">
        <div className={styles.container}>
          <div className={styles.featuresHeader}>
            <h2>Menos plataforma, más tú.</h2>
            <p>No necesitas un sitio web completo. Necesitas un lugar donde todo lo que haces conviva.</p>
          </div>
          <div className={styles.featuresGrid}>
            {[1, 2, 3].map((num) => (
              <InView key={num} className={styles.feature} delay={(num - 1) * 0.1}>
                <div className={styles.featureIcon}>{num}</div>
                <h3>{num === 1 ? 'Sin marca ajena' : num === 2 ? 'Sabes qué clickean' : 'Para tu círculo'}</h3>
                <p>
                  {num === 1 && 'Tu dominio, tu nombre, tu paleta. Nada de "powered by" al pie de página.'}
                  {num === 2 && 'Analíticas simples: visitas, clics por link, y qué funciona mejor.'}
                  {num === 3 && 'Ideal para creators, freelancers y comunidades que comparten con gente de confianza.'}
                </p>
              </InView>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.how} id="como">
        <div className={styles.container}>
          <div className={styles.howHeader}>
            <h2>Empieza en tres pasos.</h2>
          </div>
          <div className={styles.howSteps}>
            {[
              { num: 1, title: 'Crea tu página', desc: 'Elige tu usuario. Eso es todo. No hace falta email de confirmación.' },
              { num: 2, title: 'Agrega tus links', desc: 'Tu tienda, tu portafolio, tu newsletter, tus redes. Todo en un solo lugar.' },
              { num: 3, title: 'Comparte', desc: 'Copia tu link y pégalo donde quieras. Bio de Instagram, firma de mail, tarjeta de presentación.' }
            ].map((step) => (
              <InView key={step.num} className={styles.howStep} delay={(step.num - 1) * 0.1}>
                <div className={styles.howNum}>{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </InView>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faq} id="faq">
        <div className={styles.container}>
          <div className={styles.faqHeader}>
            <h2>Preguntas frecuentes.</h2>
          </div>
          <Accordion
            items={FAQ_ITEMS}
            className={styles.faqList}
            itemClassName={styles.faqItem}
            summaryClassName={styles.faqSummary}
            answerClassName={styles.faqAnswer}
          />
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2>Empieza en 30 segundos.</h2>
          <p>Sin código. Sin marca ajena. Solo tu link.</p>
          <SignupForm />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container + ' ' + styles.footerInner}>
          <a href="/" className={styles.footerLogo}>Linko</a>
          <div className={styles.footerLinks}>
            <a href="/" onClick={() => false} title="Privacidad">Privacidad</a>
            <a href="/" onClick={() => false} title="Términos">Términos</a>
            <a href="/" onClick={() => false} title="Contacto">Contacto</a>
          </div>
          <span className={styles.footerCopy}>© 2025 Linko. Hecho para creadores.</span>
        </div>
      </footer>
    </>
  );
};

export default Home;
