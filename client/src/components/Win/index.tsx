import React, { useEffect, useRef } from 'react';
import './Win.css';
import { useSocketContext } from '../../contexts/SocketContext';

export default function Win() {
  const { win, setIsWin } = useSocketContext();
  const bublesElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!win) return;

    const random = (min: number, max: number): number => {
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        return Number((Math.random() * (max - min) + min).toFixed(1));
      }
      return Math.floor(Math.random() * (max + 1 - min)) + min;
    };
    const move = (
      elem: HTMLElement,
      limitX: number,
      limitY: number,
      limitScale: number,
      speed: number,
    ): void => {
      let x = 0;
      let y = 0;
      let speedX = 0;
      let speedY = 0;
      let opacity = 0;
      let scale = 0;
      let raf: number | null = null;

      if (Math.abs(limitX) > Math.abs(limitY)) {
        speedX = speed;
        speedY = speed / (Math.abs(limitX) / Math.abs(limitY));
      } else {
        speedX = speed / (Math.abs(limitY) / Math.abs(limitX));
        speedY = speed;
      }

      if (limitX < 0) {
        speedX = speedX * -1;
      }

      if (limitY < 0) {
        speedY = speedY * -1;
      }

      const render = () => {
        if (Math.abs(y) >= Math.abs(limitY)) {
          elem.style.top = `${limitY}px`;
        }
        if (Math.abs(x) >= Math.abs(limitX)) {
          elem.style.left = `${limitX}px`;
          elem.style.opacity = '0';

          window.cancelAnimationFrame(raf!);
          elem.remove();
          return;
        }

        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.opacity = `${1 - opacity}`;
        elem.style.transform = `scale(${1 + scale})`;

        x = x + speedX;
        y = y + speedY;
        opacity = x / limitX;
        scale =
          Number((x / limitX).toFixed(1)) * Number((limitScale - 1).toFixed(1));

        window.requestAnimationFrame(render);
      };

      raf = window.requestAnimationFrame(render);
    };

    const bublesCount = 24;
    for (let i = 0; i < bublesCount; i++) {
      const div = document.createElement('div');
      div.classList.add('buble');
      let x = 0;
      let y = 0;

      if (i % 4 === 0) {
        x = random(-250, 0);
        y = random(-170, 0);
      }

      if (i % 4 === 1) {
        x = random(0, 250);
        y = random(-170, 0);
      }

      if (i % 4 === 2) {
        x = random(0, 250);
        y = random(0, 170);
      }

      if (i % 4 === 3) {
        x = random(-250, 0);
        y = random(0, 170);
      }

      const speed = random(1, 3);
      const scale = random(0.8, 2);

      bublesElem.current!.insertAdjacentElement('beforeend', div);

      move(div, x, y, scale, speed);
    }
  }, [win]);
  return (
    <div className={win ? 'win show' : 'win'} onClick={() => setIsWin(false)}>
      <div className="effect">
        <div className="effect_text">
          HOME RUN
          <div className="effect_bubles" ref={bublesElem}></div>
        </div>
      </div>
    </div>
  );
}
