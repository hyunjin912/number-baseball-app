import React, { useEffect } from 'react';
import { useSocketContext } from '../../contexts/SocketContext';

interface NoticeProps {
  msg: string;
  style: React.CSSProperties;
  children?: React.ReactNode;
  type?: 'auto';
}

export default function Notice({ msg, style, type }: NoticeProps) {
  const { setIsHostGone } = useSocketContext();

  useEffect(() => {
    if (type === 'auto') {
      let clear: NodeJS.Timeout = setTimeout(() => {
        setIsHostGone(false);
      }, 3000);

      return () => {
        clearTimeout(clear);
      };
    }
  }, []);
  return <div style={style}>{msg}</div>;
}
