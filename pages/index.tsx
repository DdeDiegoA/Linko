import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InView } from '@/components/animate-ui/effects/in-view';
import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';
import { AnimateButton } from '@/components/animate-ui/buttons/button';
import { Accordion } from '@/components/animate-ui/components/accordion';
import { useToast } from '@/components/Toast';
import styles from './landing.module.css';

const FAQ_ITEMS = [
  { q: '¿Necesito saber programar?', a: 'No. Linko se crea desde el navegador. Elige tu nombre, sube una foto, agrega links y listo.' },
  { q: '¿Es gratis?', a: 'Sí. La versión base es gratuita y sin límites de links. Por ahora hay 20 cupos: solicitás acceso desde la landing y nuestro equipo revisa cada postulación.' },
  { q: '¿Cómo solicito acceso?', a: 'Tocás cualquier botón de "Solicitar acceso" en esta página, se abre un mini-form con username, email y un texto contándonos por qué lo querés. Si sos de los 20 elegidos, te llegan las credenciales por email.' },
  { q: '¿Puedo usar mi propio dominio?', a: 'En la versión gratuita tienes un link tipo linko.tu/usuario. El dominio propio llegará pronto.' },
  { q: '¿Quién ve mis analíticas?', a: 'Solo tú. No vendemos datos ni mostramos publicidad basada en tu tráfico.' },
];

type SignupFormProps = {
  username: string;
  email: string;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

const SignupForm = ({ username, email, onUsernameChange, onEmailChange, onSubmit }: SignupFormProps) => (
  <form className={styles.heroForm} onSubmit={onSubmit}>
    <input
      type="text"
      name="username"
      value={username}
      onChange={(e) => onUsernameChange(e.target.value)}
      className={styles.heroInput}
        placeholder="maru.creates"
        aria-label="Nombre de usuario"
      autoCapitalize="none"
      autoCorrect="off"
    />
    <input
      type="email"
      name="email"
      value={email}
      onChange={(e) => onEmailChange(e.target.value)}
      className={styles.heroInput}
        placeholder="hola@tudominio.com"
        aria-label="Email"
      autoCapitalize="none"
      autoCorrect="off"
      inputMode="email"
    />
    <AnimateButton type="submit" className={styles.heroBtn}>Solicitar acceso</AnimateButton>
  </form>
);

type AccessModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  username: string;
  onUsernameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  loading: boolean;
  done: boolean;
};

const AccessModal = ({
  open,
  onClose,
  onSubmit,
  username,
  onUsernameChange,
  email,
  onEmailChange,
  reason,
  onReasonChange,
  loading,
  done,
}: AccessModalProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Solicitar acceso a Linko"
      >
        <motion.div
          className={styles.modalCard}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {done ? (
            <div className={styles.modalSuccess}>
              <h3>¡Solicitud enviada!</h3>
              <p>
                Recibimos tu solicitud para unirte a Linko. Tenemos cupos limitados (20 por ahora),
                así que revisamos cada postulación a mano. Te avisaremos por email si sos de los elegidos.
              </p>
              <button type="button" onClick={onClose} className={styles.modalCloseBtn}>
                Volver
              </button>
            </div>
          ) : (
            <form className={styles.modalForm} onSubmit={onSubmit}>
              <div className={styles.modalHeader}>
                <h3>Solicitar acceso</h3>
                <button type="button" onClick={onClose} className={styles.modalClose} aria-label="Cerrar">×</button>
              </div>
              <p className={styles.modalSub}>Cupos limitados (20). Contanos por qué lo querés.</p>

              <label htmlFor="m-username" className={styles.modalLabel}>Username</label>
              <input
                id="m-username"
                type="text"
                required
                pattern="[a-z0-9_-]{3,30}"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="maru.creates"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className={styles.modalInput}
              />

              <label htmlFor="m-email" className={styles.modalLabel}>Email</label>
              <input
                id="m-email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                placeholder="hola@tudominio.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className={styles.modalInput}
              />

              <label htmlFor="m-reason" className={styles.modalLabel}>¿Por qué querés Linko?</label>
              <textarea
                id="m-reason"
                required
                minLength={20}
                maxLength={500}
                rows={5}
                placeholder="Soy creadora de contenido y quiero un solo link para mi tienda, newsletter y redes."
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                className={styles.modalTextarea}
              />

              <AnimateButton
                type="submit"
                disabled={loading}
                className={styles.modalSubmit}
              >
                {loading ? 'Enviando…' : 'Enviar solicitud'}
              </AnimateButton>
            </form>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Home: NextPage = () => {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsername, setModalUsername] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalDone, setModalDone] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ponytail: bloquea el scroll del body mientras el modal está abierto
  useEffect(() => {
    if (modalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [modalOpen]);

  // ponytail: el redirect ?modal=access viene desde /solicitar y /register (viejos links)
  useEffect(() => {
    if (router.query.modal === 'access') {
      const u = typeof router.query.username === 'string' ? router.query.username : '';
      if (u) setModalUsername(u);
      setModalOpen(true);
      // limpiamos la query para que no re-abra al volver atrás
      router.replace('/', undefined, { shallow: true });
    }
  }, [router.query.modal]);

  function openModal() {
    setModalUsername(username.trim());
    setModalEmail(email.trim());
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalDone(false);
    setModalUsername('');
    setModalEmail('');
    setModalReason('');
  }

  async function handleModalSubmit(e: FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: modalUsername,
          email: modalEmail,
          reason: modalReason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? 'Error al enviar la solicitud');
        return;
      }
      setModalDone(true);
    } catch {
      toast.error('No se pudo conectar con el servidor');
    } finally {
      setModalLoading(false);
    }
  }

  const handleHeroFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openModal();
  };

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
            <motion.button
              type="button"
              onClick={openModal}
              className={styles.navCta}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              Solicitar acceso
            </motion.button>
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
          <SignupForm
            username={username}
            email={email}
            onUsernameChange={setUsername}
            onEmailChange={setEmail}
            onSubmit={handleHeroFormSubmit}
          />
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
              { num: 1, title: 'Solicitá acceso', desc: 'Dejanos tu usuario, email y un texto contándonos por qué lo querés. Hay 20 cupos por ahora.' },
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
          <SignupForm
            username={username}
            email={email}
            onUsernameChange={setUsername}
            onEmailChange={setEmail}
            onSubmit={handleHeroFormSubmit}
          />
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

      <AccessModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        username={modalUsername}
        onUsernameChange={setModalUsername}
        email={modalEmail}
        onEmailChange={setModalEmail}
        reason={modalReason}
        onReasonChange={setModalReason}
        loading={modalLoading}
        done={modalDone}
      />
    </>
  );
};

export default Home;
