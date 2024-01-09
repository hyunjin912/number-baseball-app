import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { User, useAuthContext } from './AuthContext';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

interface Context {
  [key: string]: any;
}

type SocketProviderProps = {
  children: React.ReactNode;
};

export type Message = {
  type: 'system' | 'user' | 'rule';
  nickname?: string;
  team?: string;
  msg: string;
};

export type Room = {
  author: User;
  roomName: string;
  roomNumber: string;
  usersInTheRoom: {
    nickname: string;
    team: string;
    ready?: boolean;
    settingNumber: String;
  }[];
  messages: Message[];
};

export type RoomRegisterInfo = {
  // 나중에 비밀번호, 인원추가 등 추가 될 여지가 있으니 객체로 사용
  roomname: string;
};

interface ServerToClientEvents {
  noticeUser: (users: User[]) => void;
  noticeRoom: (rooms: Room[]) => void;
  updateRoom: (
    updatedRoom: Room,
    resetRoom?: { isReady: false; sec: null; isMyTurn: false },
  ) => void;
  leaveRoom: () => void;
  getMessage: (message: Message[] | []) => void;
  getRecord: (record: { attackNumber: string; score: string }[] | []) => void;
  timer: (sec: number) => void;
  callTimer: (timerType: 'start' | 'clear') => void;
  changeTurn: () => void;
  win: () => void;
}

interface ClientCallbackData {
  ok?: boolean;
  currentUser?: User;
  newRoom?: Room;
  error?: string;
  messages?: Message[];
}

interface ClientToServerEvents {
  login: (user: User, callback: (data: ClientCallbackData) => void) => void;
  registerRoom: (
    room: Room,
    callback: (data: ClientCallbackData) => void,
  ) => void;
  enterRoom: (
    room: Room,
    user: User,
    callback: (data: ClientCallbackData) => void,
  ) => void;
  deleteRoom: (
    room: Room,
    callback: (data: ClientCallbackData) => void,
  ) => void;
  leaveRoom: (room: Room, callback: (data: ClientCallbackData) => void) => void;
  selectTeam: (team: string, room: Room) => void;
  sendMessage: (attackNumber: string, room: Room) => void;
  callReady: (settingNumber: string, room: Room) => void;
  startTimer: () => void;
  clearTimer: () => void;
}

const SocketContext = createContext<Context>({} as Context);
export default function SocketProvider({ children }: SocketProviderProps) {
  const navigate = useNavigate();
  const { user, setUser, updateRegisterInfo } = useAuthContext();
  const [socket, setSocket] =
    useState<Socket<ServerToClientEvents, ClientToServerEvents>>();
  const [users, setUsers] = useState<(typeof user)[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLogin, setIsLogin] = useState(false);
  const [roomRegisterInfo, setRoomRegisterInfo] = useState<RoomRegisterInfo>({
    roomname: '',
  });
  const [team, setTeam] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timer, setTimer] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [sec, setSec] = useState<number | null>(null);
  const [records, setRecords] = useState<
    { attackNumber: string; score: string }[]
  >([]);
  const [win, setIsWin] = useState(false);
  const [isHostGone, setIsHostGone] = useState(false);

  const updateRoomRegisterInfo = useCallback((info: RoomRegisterInfo) => {
    setRoomRegisterInfo(info);
  }, []);

  const registerRoom = useCallback(() => {
    const roomName = roomRegisterInfo.roomname.trim();
    const room: Room = {
      author: user!._id,
      roomName: roomName ? roomName : `${user!.nickname}님의 방`,
      roomNumber: user!.token,
      usersInTheRoom: [
        {
          nickname: user!.nickname,
          team: '',
          settingNumber: '',
        },
      ],
      messages: [],
    };

    navigate('/play');

    // 방 생성
    socket?.emit('registerRoom', room, (data) => {
      if (data.newRoom) {
        setRoom(data.newRoom);
      }
    });
  }, [roomRegisterInfo, user, socket]);

  const enterRoom = useCallback(
    (room: Room) => {
      // 방 입장
      socket?.emit('enterRoom', room, user, (data) => {
        navigate('/play');
        if (data.newRoom) {
          setRoom(data.newRoom);
        }
      });
    },
    [user, socket],
  );

  const selectTeam = useCallback(
    (team: string) => {
      setTeam(team);

      // 팀 선택
      socket?.emit('selectTeam', team, room!);
    },
    [socket, room],
  );

  const sendMessage = useCallback(
    (attackNumber: string) => {
      // 메세지 보내기
      socket?.emit('sendMessage', attackNumber, room!);
    },
    [socket, room],
  );

  const callReady = useCallback(
    (settingNumber: string) => {
      setIsReady(true);

      // 게임 준비
      socket?.emit('callReady', settingNumber, room!);
    },
    [socket, room],
  );

  const resetRoomSettings = useCallback(() => {
    setRoom(null);
    setTeam('');
    setIsReady(false);
    setTimer(false);
    setIsMyTurn(false);
    setSec(null);
    setRecords([]);
    setMessages([]);
    setIsWin(false);
  }, []);

  // 소켓 연결
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_SOCKET}`);
    setSocket(newSocket);
  }, []);

  useEffect(() => {
    if (!user || isLogin) return;

    // 로그인
    socket?.emit('login', user, (data) => {
      setIsLogin(true);
      setUser(data.currentUser);
    });

    // 전체 유저 상태 알림
    socket?.on('noticeUser', (users) => {
      setUsers(users);
    });

    // 전체 방 상태 알림
    socket?.on('noticeRoom', (rooms) => {
      setRooms(rooms);
    });

    // 방 설정 업데이트
    socket?.on('updateRoom', (updatedRoom, resetRoom) => {
      setRoom(updatedRoom);

      // 게스트 퇴장 시 호스트의 룸 설정을 리셋
      if (resetRoom instanceof Object) {
        setIsReady(resetRoom.isReady);
        setSec(resetRoom.sec);
        setIsMyTurn(resetRoom.isMyTurn);
      }
    });

    // 호스트 퇴장 시 게스트의 모든 설정 리셋
    socket?.on('leaveRoom', () => {
      resetRoomSettings();
      navigate('/room', { replace: true });
      setIsHostGone(true);
    });

    // 메세지 받기
    socket?.on('getMessage', (message) => {
      if (message.length > 0) {
        setMessages((prev) => [...prev, ...message]);
      } else {
        setMessages([]);
      }
    });

    // 기록 받기
    socket?.on('getRecord', (record) => {
      if (record.length > 0) {
        setRecords((prev) => [...prev, ...record]);
      } else {
        setRecords([]);
      }
    });

    // 타이머 적용
    socket?.on('timer', (sec) => {
      setSec(sec);
    });

    // 타이머 시작 및 멈춤
    socket?.on('callTimer', (type) => {
      if (type === 'start') {
        socket?.emit('startTimer');
      }

      if (type === 'clear') {
        socket?.emit('clearTimer');
      }
    });

    // 본인 차례 적용 및 취소
    socket?.on('changeTurn', () => {
      setIsMyTurn((prev) => !prev);
    });

    // 승리
    socket?.on('win', () => {
      setIsWin(true);
    });
  }, [user, socket]);

  useEffect(() => {
    function pop() {
      const pathname = window.location.pathname;

      switch (pathname) {
        case '/':
          socket?.disconnect();
          socket?.off();
          socket?.connect();
          setUser(null);
          setIsLogin(false);
          updateRegisterInfo({ nickname: '' });
          return;
        case '/room':
          if (room !== null) {
            if (user.token === room.roomNumber) {
              // 호스트 퇴장 시 호스트의 모든 설정 리셋
              socket?.emit('deleteRoom', room, (data) => {
                resetRoomSettings();
              });
            } else {
              // 게스트 퇴장 시 게스트의 모든 설정 리셋
              socket?.emit('leaveRoom', room, (data) => {
                resetRoomSettings();
              });
            }
          }
          return;
        case '/play':
          if (room === null) {
            navigate('/room', { replace: true });
          }
          return;
        default:
          return null;
      }
    }
    window.addEventListener('popstate', pop);

    return () => {
      window.removeEventListener('popstate', pop);
    };
  }, [user, socket, room]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        users,
        room,
        rooms,
        roomRegisterInfo,
        updateRoomRegisterInfo,
        registerRoom,
        enterRoom,
        team,
        selectTeam,
        sendMessage,
        messages,
        callReady,
        isReady,
        timer,
        isMyTurn,
        sec,
        records,
        win,
        setIsWin,
        isHostGone,
        setIsHostGone,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const providerValue = useContext(SocketContext);
  return providerValue;
}
