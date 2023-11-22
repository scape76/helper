import { useEffect, useState } from 'react';

const useHref = () => {
  const [href, setHref] = useState(window.location.href);

  const listenToPopstate = () => {
    const winHref = window.location.href;
    setHref(winHref);
  };

  useEffect(() => {
    window.addEventListener('popstate', listenToPopstate);
    return () => {
      window.removeEventListener('popstate', listenToPopstate);
    };
  }, []);
  return href;
};

export { useHref };
