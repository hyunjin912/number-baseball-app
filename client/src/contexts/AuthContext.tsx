import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';

type AuthProviderProps = {
  children: React.ReactNode;
};

interface Context {
  [key: string]: any;
}

export type User = {
  [key: string]: unknown;
  nickname: string;
  token: string;
  _id: string;
};

export type RegisterInfo = {
  // 나중에 비밀번호, 이메일 등 추가 될 여지가 있으니 객체로 사용
  nickname: string;
};

const AuthContext = createContext<Context>({} as Context);

export default function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [view, setView] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [registerInfo, setRegisterInfo] = useState<RegisterInfo>({
    nickname: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const updateRegisterInfo = useCallback((info: RegisterInfo) => {
    setRegisterInfo(info);
    setErrorMessage('');
  }, []);

  const registerUser = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (errorMessage) return;
      if (registerInfo.nickname.trim() === '') {
        setErrorMessage('닉네임을 입력해주세요');
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_USER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: registerInfo.nickname.trim(),
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setUser(data.currentUser);
        navigate('/room');
      } else {
        setErrorMessage(data.error);
      }
    },
    [registerInfo],
  );

  useEffect(() => {
    const clear = setTimeout(() => {
      setView(true);
    }, 2200);

    return () => {
      clearTimeout(clear);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        registerInfo,
        updateRegisterInfo,
        errorMessage,
        setErrorMessage,
        user,
        setUser,
        registerUser,
        view,
        setView,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const providerValue = useContext(AuthContext);
  return providerValue;
}
