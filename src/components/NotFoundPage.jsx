import { useNavigate } from 'react-router-dom';
import FuzzyText from './ui/FuzzyText';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#030407',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <FuzzyText
        intro
        trigger="hover"
        baseIntensity={0.2}
        hoverIntensity={0.5}
        fontSize="clamp(4rem, 15vw, 13rem)"
        fontWeight={900}
        fontFamily="'ui-monospace', SFMono-Regular, Consolas, monospace"
        color="#fff"
      >
        404
      </FuzzyText>
      <div style={{ marginTop: '3rem' }}>
        <FuzzyText
          intro
          trigger="hover"
          baseIntensity={0.2}
          hoverIntensity={0.5}
          fontSize="clamp(3rem, 15vw, 2rem)"
          fontWeight={900}
          fontFamily="'ui-monospace', SFMono-Regular, Consolas, monospace"
          color="#fff"
        >
          Page not found
        </FuzzyText>
      </div>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '1.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          opacity: 0.6,
          textTransform: 'uppercase',
          padding: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
      >
        Back to home
      </button>
    </div>
  );
}
