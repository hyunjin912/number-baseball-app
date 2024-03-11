import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Talk.css';
import Notice from '../Notice';
import { teamList } from '../../pages/PlayPage';
import { useSocketContext, Message } from '../../contexts/SocketContext';
import { useAuthContext } from '../../contexts/AuthContext';

const noticeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '130%',
  background: 'rgba(0,0,0,0.8)',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '40px',
  left: '50%',
  transform: 'translateX(-50%)',
  whiteSpace: 'nowrap',
};

export default function Talk() {
  const { user } = useAuthContext();
  const {
    sendMessage,
    messages,
    callReady,
    isReady,
    room,
    records,
    isMyTurn,
    sec,
  } = useSocketContext();
  const [input, setInput] = useState({
    settingNumber: '',
    attackNumber: '',
  });
  const [isError, setIsError] = useState({
    isZero: false,
    isRepeat: false,
  });
  const talkListElem = useRef<HTMLUListElement>(null);
  const settingNumberElem = useRef<HTMLInputElement>(null);
  const attackNumberElem = useRef<HTMLInputElement>(null);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      setIsError((prev) => ({ ...prev, isZero: true }));
      return;
    }

    const reg = /[^0-9]/gi;
    const originValue = e.target.value.split('');
    const copiedValue = new Set(originValue);

    if (reg.test(e.target.value)) {
      setInput((prev) => ({ ...prev }));
      return;
    }

    if (originValue.length > copiedValue.size) {
      setInput((prev) => ({ ...prev }));
      setIsError((prev) => ({ ...prev, isRepeat: true }));
      return;
    }

    setInput((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    setIsError({
      isZero: false,
      isRepeat: false,
    });
  }, []);

  const onReady = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      callReady(input.settingNumber);
    },
    [input],
  );

  const onSendMessage = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      sendMessage(input.attackNumber);
      setInput((prev) => ({ ...prev, attackNumber: '' }));
    },
    [input],
  );

  useEffect(() => {
    if (!isReady) {
      setInput({
        settingNumber: '',
        attackNumber: '',
      });
    }
  }, [isReady]);

  useEffect(() => {
    talkListElem.current!.scrollTop = talkListElem.current!.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const settingNumberElemShouldAutoFocus = room.usersInTheRoom.every(
      (user: (typeof room.usersInTheRoom)[0]) => user.team !== '',
    );

    const attackNumberElemShouldAutoFocus = room.usersInTheRoom.every(
      (user: (typeof room.usersInTheRoom)[0]) => user.ready === true,
    );

    if (settingNumberElemShouldAutoFocus) {
      settingNumberElem.current!.focus();
      talkListElem.current!.scrollTop = talkListElem.current!.scrollHeight;
    }

    if (attackNumberElemShouldAutoFocus) {
      attackNumberElem.current!.focus();
      talkListElem.current!.scrollTop = talkListElem.current!.scrollHeight;
    }
  }, [room]);

  return (
    <div className="talk">
      <div className="talk_tit">
        <div className="talk_tit_text">{room.roomName}</div>
        <div className="talk_tit_sec">{sec}</div>
      </div>
      <div className="talk_view">
        <ul className="talk_list" ref={talkListElem}>
          {messages.map((msg: Message, idx: number) => {
            const [myTeam] = teamList.filter((team) => team.name === msg.team);
            const isHost = user.nickname === msg.nickname;

            if (msg.type === 'system') {
              return (
                <li key={idx} className="system">
                  {msg.msg}
                </li>
              );
            } else if (msg.type === 'rule') {
              return (
                <li key={idx} className="rule">
                  {msg.msg}
                </li>
              );
            } else if (msg.type === 'user') {
              return (
                <li key={idx} className={isHost ? 'myself' : ''}>
                  <div
                    className="team_logo"
                    style={{ backgroundImage: `url(${myTeam.src})` }}
                  ></div>
                  <div className="comment">
                    <div className="user">{isHost ? '' : msg.nickname}</div>
                    {isHost ? (
                      msg.msg === '준비완료!!' ? (
                        <div className="txt">{msg.msg}</div>
                      ) : (
                        <div className="txt">
                          공격 : {msg.msg}
                          <br />
                          결과 : {msg.score}
                        </div>
                      )
                    ) : (
                      <div className="txt">{msg.msg}</div>
                    )}
                  </div>
                </li>
              );
            }
          })}
        </ul>
        <div className="talk_forms_wrap">
          <div className={isMyTurn ? 'talk_forms my_turn' : 'talk_forms'}>
            {isError.isZero && (
              <Notice msg={'첫 숫자로 0이 올 수 없어요'} style={noticeStyle} />
            )}
            {isError.isRepeat && (
              <Notice msg={'숫자는 중복될 수 없어요'} style={noticeStyle} />
            )}
            <div className="talk_forms_inner">
              <form className="talk_ready" onSubmit={onReady}>
                <div className="form_field">
                  <input
                    type="text"
                    name="settingNumber"
                    maxLength={4}
                    ref={settingNumberElem}
                    autoComplete="off"
                    placeholder={
                      room.usersInTheRoom.length < 2 ||
                      room.usersInTheRoom.some(
                        (user: (typeof room.usersInTheRoom)[0]) =>
                          user.team === '',
                      )
                        ? 'Lack of team'
                        : 'Set a number'
                    }
                    onChange={onChange}
                    value={input.settingNumber}
                    autoFocus={true}
                    disabled={
                      isReady ||
                      room.usersInTheRoom.length < 2 ||
                      room.usersInTheRoom.some(
                        (user: (typeof room.usersInTheRoom)[0]) =>
                          user.team === '',
                      )
                        ? true
                        : false
                    }
                  />
                </div>
                <button
                  disabled={
                    isReady || input.settingNumber.length < 4 ? true : false
                  }
                >
                  ready
                </button>
              </form>
              <form className="talk_send" onSubmit={onSendMessage}>
                <div className="form_field">
                  <input
                    type="text"
                    name="attackNumber"
                    maxLength={4}
                    ref={attackNumberElem}
                    autoComplete="off"
                    placeholder={
                      room.usersInTheRoom.every(
                        (user: (typeof room.usersInTheRoom)[0]) =>
                          user.ready === true,
                      )
                        ? 'Attack number'
                        : 'Not all ready'
                    }
                    disabled={
                      room.usersInTheRoom.every(
                        (user: (typeof room.usersInTheRoom)[0]) =>
                          user.ready === true,
                      )
                        ? false
                        : true
                    }
                    onChange={onChange}
                    value={input.attackNumber}
                  />
                </div>
                <button
                  disabled={
                    isMyTurn && input.attackNumber.length >= 4 ? false : true
                  }
                >
                  send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
