import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ endTime, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (isExpired) {
    return (
      <div className={compact ? "text-sm font-bold text-destructive" : "text-lg font-bold text-destructive"}>
        Berakhir
      </div>
    );
  }

  if (compact) {
    if (timeLeft.days > 0) {
      return (
        <div className="text-sm font-bold text-destructive">
          {timeLeft.days}h {timeLeft.hours.toString().padStart(2, '0')}j
        </div>
      );
    }
    return (
      <div className="text-sm font-bold text-destructive">
        {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="grid grid-cols-4 gap-2 text-center">
        {timeLeft.days > 0 && (
          <div>
            <p className="countdown-digit">{timeLeft.days}</p>
            <p className="text-xs text-gray-600">HARI</p>
          </div>
        )}
        <div>
          <p className="countdown-digit">{timeLeft.hours.toString().padStart(2, '0')}</p>
          <p className="text-xs text-gray-600">JAM</p>
        </div>
        <div>
          <p className="countdown-digit">{timeLeft.minutes.toString().padStart(2, '0')}</p>
          <p className="text-xs text-gray-600">MENIT</p>
        </div>
        <div>
          <p className="countdown-digit">{timeLeft.seconds.toString().padStart(2, '0')}</p>
          <p className="text-xs text-gray-600">DETIK</p>
        </div>
      </div>
    </div>
  );
}
