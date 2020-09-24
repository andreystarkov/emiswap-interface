import React from 'react';
import { Token, TokenAmount } from '@uniswap/sdk';
import { useContext } from 'react';
import { Repeat } from 'react-feather';
import { Text } from 'rebass';
import { ThemeContext } from 'styled-components';
import { StyledBalanceMaxMini } from './styleds';

interface TradePriceProps {
  inputCurrencyRate?: number;
  inputCurrency?: Token;
  outputCurrency?: Token;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

export default function TradePrice({
  inputCurrencyRate,
  inputCurrency,
  outputCurrency,
  showInverted,
  setShowInverted,
}: TradePriceProps) {
  const theme = useContext(ThemeContext);

  let formattedPrice = inputCurrencyRate || 0;
  if (showInverted) {
    formattedPrice = 1 / formattedPrice;
  }
  formattedPrice = formattedPrice && parseFloat(formattedPrice.toFixed(6));

  const show = Boolean(inputCurrency && outputCurrency);
  const label = showInverted
    ? `${outputCurrency?.symbol} per ${inputCurrency?.symbol}`
    : `${inputCurrency?.symbol} per ${outputCurrency?.symbol}`;

  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text2}
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {show ? (
        <>
          {formattedPrice ?? '-'} {label}
          <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
            <Repeat size={14} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  );
}
