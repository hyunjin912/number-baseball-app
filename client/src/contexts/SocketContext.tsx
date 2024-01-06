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
  // type: 'system' | 'user';
  type: 'system' | 'user' | 'rule';
  nickname?: string;
  team?: string;
  msg: string;
};

export type Room = {
  author: User;
  roomName: string;
  roomNumber: string;
  // usersInTheRoom: string[],
  usersInTheRoom: {
    nickname: string;
    team: string;
    ready?: boolean;
    settingNumber: String;
  }[];
  messages: Message[];
};

export type RoomRegisterInfo = {
  // 나중에 비밀번호, 인원추가, 등 추가 될 여지가 있어니 객체로 하자
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
  //
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
  selectTeam: (
    team: string,
    room: Room,
    callback: (data: ClientCallbackData) => void,
  ) => void;
  sendMessage: (
    attackNumber: string,
    room: Room,
    callback: (data: ClientCallbackData) => void,
  ) => void;
  callReady: (
    settingNumber: string,
    room: Room,
    callback: (data: ClientCallbackData) => void,
  ) => void;
  //
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
      // usersInTheRoom: [user!.nickname],
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

    socket?.emit('registerRoom', room, (data) => {
      if (data.newRoom) {
        setRoom(data.newRoom);
      }
    });
  }, [roomRegisterInfo, user, socket]);

  const enterRoom = useCallback(
    (room: Room) => {
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

      socket?.emit('selectTeam', team, room!, (data) => {
        if (data.newRoom) {
          // setRoom(data.newRoom);
        } else {
          console.log('selectTeam!!!!! - ', data.error);
        }
      });
    },
    [socket, room],
  );

  const sendMessage = useCallback(
    (attackNumber: string) => {
      socket?.emit('sendMessage', attackNumber, room!, (data) => {
        if (data.messages) {
          // setMessages(data.messages);
          console.log('sendMessage!! - ', data.messages);
        }
      });
    },
    [socket, room],
  );

  // const callReady = useCallback(
  //   (isReady: boolean) => {
  //     socket?.emit('callReady', isReady, room!, (data) => {
  //       console.log('callReady - ', data);
  //     });
  //   },
  //   [socket, room],
  // );

  const callReady = useCallback(
    (settingNumber: string) => {
      setIsReady(true);

      socket?.emit('callReady', settingNumber, room!, (data) => {
        console.log('callReady - ', data);
      });
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
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);
  }, []);

  useEffect(() => {
    if (!user || isLogin) return;

    socket?.emit('login', user, (data) => {
      setIsLogin(true);
      setUser(data.currentUser);
    });

    socket?.on('noticeUser', (users) => {
      setUsers(users);
    });

    socket?.on('noticeRoom', (rooms) => {
      setRooms(rooms);
    });

    socket?.on('updateRoom', (updatedRoom, resetRoom) => {
      console.log('업데이트 해라! 방! - ', updatedRoom);
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
      console.log('🔰🔰eaaaaavvvvvvvvvvvvv');
      // setRoom(null);
      // setTeam('');
      // setIsReady(false);
      // setTimer(false);
      // setIsMyTurn(false);
      // setRecords([]);
      // setMessages([]);
      resetRoomSettings();
      navigate('/room', { replace: true });
      setIsHostGone(true);
    });

    socket?.on('getMessage', (message) => {
      if (message.length > 0) {
        setMessages((prev) => [...prev, ...message]);
      } else {
        setMessages([]);
      }
    });

    socket?.on('getRecord', (record) => {
      if (record.length > 0) {
        setRecords((prev) => [...prev, ...record]);
      } else {
        setRecords([]);
      }
    });

    // ------ test들 s -----
    socket?.on('timer', (sec) => {
      setSec(sec);
    });

    socket?.on('callTimer', (type) => {
      if (type === 'start') {
        console.log('startTimer ------- ');
        socket?.emit('startTimer');
      }

      if (type === 'clear') {
        console.log('------- clearTimer');
        socket?.emit('clearTimer');
      }
    });

    socket?.on('changeTurn', () => {
      console.log(`🔰🔰turn user - ${isMyTurn}-> ${!isMyTurn}`);
      setIsMyTurn((prev) => !prev);
    });

    socket?.on('win', () => {
      setIsWin(true);
    });

    // ------ test들 e -----
  }, [user, socket]);

  useEffect(() => {
    function pop() {
      const pathname = window.location.pathname;

      switch (pathname) {
        case '/':
          socket?.disconnect();
          socket?.connect();
          setUser(null);
          setIsLogin(false);
          updateRegisterInfo({ nickname: '' });
          navigate('/');
          return;
        case '/room':
          if (room !== null) {
            if (user.token === room.roomNumber) {
              // 호스트 퇴장 시 호스트의 모든 설정 리셋
              socket?.emit('deleteRoom', room, (data) => {
                resetRoomSettings();
                // setRoom(null);
                // setTeam('');
                // setIsReady(false);
                // setTimer(false);
                // setIsMyTurn(false);
                // setRecords([]);
                // setMessages([]);
              });
            } else {
              // 게스트 퇴장 시 게스트의 모든 설정 리셋
              socket?.emit('leaveRoom', room, (data) => {
                resetRoomSettings();
                // setRoom(null);
                // setTeam('');
                // setIsReady(false);
                // setTimer(false);
                // setIsMyTurn(false);
                // setRecords([]);
                // setMessages([]);
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
