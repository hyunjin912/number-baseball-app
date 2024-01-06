import React, { useCallback, useEffect, useState } from 'react';
import './PlayPage.css';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSocketContext } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import HH from '../../images/HH.png';
import KA from '../../images/KA.png';
import KT from '../../images/KT.png';
import LG from '../../images/LG.png';
import LT from '../../images/LT.png';
import NC from '../../images/NC.png';
import DS from '../../images/DS.png';
import SSG from '../../images/SSG.png';
import SS from '../../images/SS.png';
import KW from '../../images/KW.png';
import Team from '../../components/Team';
import Record from '../../components/Record';
import Talk from '../../components/Talk';
import Win from '../../components/Win';

export const teamList = [
  { name: 'HH', src: HH, alt: '한화' },
  { name: 'KA', src: KA, alt: '기아' },
  { name: 'KT', src: KT, alt: 'KT' },
  { name: 'LG', src: LG, alt: 'LG' },
  { name: 'LT', src: LT, alt: '롯데' },
  { name: 'NC', src: NC, alt: 'NC' },
  { name: 'DS', src: DS, alt: '두산' },
  { name: 'SSG', src: SSG, alt: 'SSG' },
  { name: 'SS', src: SS, alt: '삼성' },
  { name: 'KW', src: KW, alt: '키움' },
];

export default function PlayPage() {
  const { user } = useAuthContext();
  const { team, win } = useSocketContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, []);

  if (!user) {
    return null;
  }
  if (!team) {
    return <Team />;
  } else {
    return (
      <>
        <div className="play">
          <div className="play_board">
            <Record />
            <Talk />
          </div>
        </div>
        <Win />
      </>
    );
  }
}
