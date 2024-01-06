import React from 'react';
import './Team.css';
import { teamList } from '../../pages/PlayPage';
import { useSocketContext } from '../../contexts/SocketContext';

export default function Team() {
  const { selectTeam } = useSocketContext();

  const onSelect = (e: React.MouseEvent<HTMLLIElement>) => {
    selectTeam(e.currentTarget.dataset.name!);
  };
  return (
    <div className="team">
      <div className="inner">
        <ul className="team_list">
          {teamList.map((team, idx) => (
            <li
              key={idx}
              className="team_item"
              data-name={team.name}
              onClick={onSelect}
            >
              <img src={team.src} alt={team.alt} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
