import { useState } from 'react';
import { Calculator, X } from 'lucide-react';

export default function FloatingCalculator({ data }) {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [mode, setMode] = useState('foreignToTwd'); // 'foreignToTwd' | 'twdToForeign'

  const rate = data?.exchangeRate || 1;
  const currency = data?.currency || 'USD';
  const currencySymbol = data?.currencySymbol || '$';
  const inverseRate = 1 / rate;

  const convertedValue = mode === 'foreignToTwd'
    ? (parseFloat(display) * rate).toLocaleString('zh-TW', { maximumFractionDigits: 0 })
    : (parseFloat(display) / rate).toLocaleString('zh-TW', { maximumFractionDigits: 2 });

  const convertedCurrency = mode === 'foreignToTwd' ? 'TWD' : currency;
  const convertedSymbol = mode === 'foreignToTwd' ? 'NT$' : currencySymbol;

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const performOperation = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (prevValue == null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue;
      let result;

      switch (operator) {
        case '+': result = currentValue + inputValue; break;
        case '-': result = currentValue - inputValue; break;
        case '*': result = currentValue * inputValue; break;
        case '/': result = inputValue !== 0 ? currentValue / inputValue : 0; break;
        default: result = inputValue;
      }

      setPrevValue(result);
      setDisplay(String(parseFloat(result.toFixed(10))));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    if (operator === null || prevValue === null) return;
    const inputValue = parseFloat(display);
    let result;

    switch (operator) {
      case '+': result = prevValue + inputValue; break;
      case '-': result = prevValue - inputValue; break;
      case '*': result = prevValue * inputValue; break;
      case '/': result = inputValue !== 0 ? prevValue / inputValue : 0; break;
      default: result = inputValue;
    }

    setDisplay(String(parseFloat(result.toFixed(10))));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (waitingForOperand) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const toggleMode = () => {
    setMode(mode === 'foreignToTwd' ? 'twdToForeign' : 'foreignToTwd');
    clearAll();
  };

  const numberButtons = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  const isOperator = (val) => ['+', '-', '*', '/'].includes(val);

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-transform"
        style={{ maxWidth: '430px' }}
      >
        <Calculator size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary-dark text-white">
              <span className="font-semibold text-sm">匯率計算機</span>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition">
                <X size={18} />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex mx-4 mt-3 rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => { setMode('foreignToTwd'); clearAll(); }}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  mode === 'foreignToTwd'
                    ? 'bg-accent text-white'
                    : 'bg-surface text-primary-light'
                }`}
              >
                {currency} → TWD
              </button>
              <button
                onClick={() => { setMode('twdToForeign'); clearAll(); }}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  mode === 'twdToForeign'
                    ? 'bg-accent text-white'
                    : 'bg-surface text-primary-light'
                }`}
              >
                TWD → {currency}
              </button>
            </div>

            {/* Display */}
            <div className="mx-4 mt-3 p-4 bg-primary-dark rounded-xl">
              <div className="text-right">
                <p className="text-white/60 text-xs mb-1">
                  {mode === 'foreignToTwd' ? currencySymbol : 'NT$'}
                </p>
                <p className="text-white text-2xl font-bold tracking-wide truncate">
                  {parseFloat(display).toLocaleString('zh-TW', { maximumFractionDigits: 10 })}
                </p>
              </div>
              <div className="border-t border-white/20 mt-3 pt-3 text-right">
                <p className="text-white/60 text-xs mb-1">{convertedSymbol}</p>
                <p className="text-accent-light text-xl font-bold tracking-wide">
                  ≈ {convertedValue}
                </p>
              </div>
            </div>

            {/* Keypad */}
            <div className="p-4 grid grid-cols-4 gap-2">
              {/* Top row: C, ←, and spacers */}
              <button
                onClick={clearAll}
                className="col-span-2 py-3 rounded-xl bg-surface text-primary-dark font-semibold text-sm hover:bg-border transition"
              >
                C
              </button>
              <button
                onClick={handleBackspace}
                className="col-span-2 py-3 rounded-xl bg-surface text-primary-dark font-semibold text-sm hover:bg-border transition"
              >
                ←
              </button>

              {/* Number and operator grid */}
              {numberButtons.map((row, rowIdx) =>
                row.map((btn, colIdx) => {
                  const key = `${rowIdx}-${colIdx}`;

                  if (btn === '=') {
                    return (
                      <button
                        key={key}
                        onClick={handleEquals}
                        className="py-3 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent/80 transition"
                      >
                        =
                      </button>
                    );
                  }

                  if (isOperator(btn)) {
                    return (
                      <button
                        key={key}
                        onClick={() => performOperation(btn)}
                        className={`py-3 rounded-xl font-bold text-base transition ${
                          operator === btn && waitingForOperand
                            ? 'bg-primary text-white'
                            : 'bg-primary-dark/10 text-primary-dark hover:bg-primary-dark/20'
                        }`}
                      >
                        {btn === '*' ? '×' : btn === '/' ? '÷' : btn}
                      </button>
                    );
                  }

                  if (btn === '.') {
                    return (
                      <button
                        key={key}
                        onClick={inputDecimal}
                        className="py-3 rounded-xl bg-surface text-primary-dark font-semibold text-base hover:bg-border transition"
                      >
                        .
                      </button>
                    );
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => inputNumber(btn)}
                      className="py-3 rounded-xl bg-surface text-primary-dark font-semibold text-base hover:bg-border transition"
                    >
                      {btn}
                    </button>
                  );
                })
              )}
            </div>

            {/* Rate Info */}
            <div className="px-4 pb-4 text-center">
              <p className="text-[11px] text-primary-light">
                匯率：1 {currency} = {rate.toFixed(4)} TWD ｜ 1 TWD = {inverseRate.toFixed(6)} {currency}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
