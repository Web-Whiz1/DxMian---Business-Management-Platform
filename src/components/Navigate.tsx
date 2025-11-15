import { useEffect } from 'react';

interface NavigateProps {
  to: string;
}

export function Navigate({ to }: NavigateProps) {
  useEffect(() => {
    window.location.href = to;
  }, [to]);

  return null;
}
