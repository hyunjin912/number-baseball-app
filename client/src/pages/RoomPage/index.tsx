import React, { useEffect } from 'react';
import UserList from '../../components/UserList';
import RoomList from '../../components/RoomList';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import Notice from '../../components/Notice';
import { useSocketContext } from '../../contexts/SocketContext';

const noticeStyle: React.CSSProperties = {
  position: 'absolute',
  background: 'rgba(0,0,0,0.8)',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '40px',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  whiteSpace: 'nowrap',
  zIndex: '3',
};

export default function RoomPage() {
  const { user } = useAuthContext();
  const { isHostGone, room } = useSocketContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, []);

  if (!user) {
    return null;
  } else {
    return (
      <>
        <div className="waiting_room">
          <UserList />
          <RoomList />
        </div>
        {isHostGone && (
          <Notice
            msg="방장이 퇴장하여 대기실로 이동되었습니다."
            style={noticeStyle}
            type="auto"
          />
        )}
      </>
    );
  }
}
