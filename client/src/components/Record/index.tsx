import React, { useRef, useEffect } from 'react';
import './Record.css';
import { useSocketContext } from '../../contexts/SocketContext';

export default function Record() {
  const { records } = useSocketContext();
  const recordListElem = useRef<HTMLUListElement>(null);

  useEffect(() => {
    recordListElem.current!.scrollTop = recordListElem.current!.scrollHeight;
  }, [records]);

  return (
    <div className="record">
      <div className="record_tit">
        <div>Number</div>
        <div>Score</div>
      </div>
      <ul className="record_list" ref={recordListElem}>
        {records.map(
          (record: { attackNumber: string; score: string }, idx: number) => (
            <li key={idx}>
              <div>{record.attackNumber}</div>
              <div>{record.score}</div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
