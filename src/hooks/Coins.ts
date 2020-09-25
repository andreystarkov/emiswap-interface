import { parseBytes32String } from '@ethersproject/strings';
import { Token, ETHER } from '@uniswap/sdk';
import { useMemo } from 'react';
import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks';
import { useCoinList } from '../state/invest/hooks';
import { isAddress } from '../utils';
import { useActiveWeb3React } from './index';
import { useBytes32TokenContract, useTokenContract } from './useContract';
import defaultCoins from '../constants/defaultCoins';

export function useAllCoins(): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React();
  const allCoins = useCoinList();

  return useMemo(() => {
    if (!chainId) return {};
    return { ...allCoins[chainId] };
  }, [chainId, allCoins]);
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/;
function parseStringOrBytes32(
  str: string | undefined,
  bytes32: string | undefined,
  defaultValue: string,
): string {
  return str && str.length > 0
    ? str
    : bytes32 && BYTES32_REGEX.test(bytes32)
    ? parseBytes32String(bytes32)
    : defaultValue;
}

// undefined if invalid or does not exist
// null if loading
// otherwise returns the token
export function useToken(tokenAddress?: string): Token | undefined | null {
  const { chainId } = useActiveWeb3React();
  const tokens = useAllCoins();

  const address = isAddress(tokenAddress);
  const tokenContract = useTokenContract(address ? address : undefined, false);
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false);
  const defaultToken = useDefaultCoin(tokenAddress);
  const token: Token | undefined = (address ? tokens[address] : undefined) || defaultToken;

  const tokenName = useSingleCallResult(
    token ? undefined : tokenContract,
    'name',
    undefined,
    NEVER_RELOAD,
  );
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD,
  );
  const symbol = useSingleCallResult(
    token ? undefined : tokenContract,
    'symbol',
    undefined,
    NEVER_RELOAD,
  );
  const symbolBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'symbol',
    undefined,
    NEVER_RELOAD,
  );
  const decimals = useSingleCallResult(
    token ? undefined : tokenContract,
    'decimals',
    undefined,
    NEVER_RELOAD,
  );

  return useMemo(() => {
    if (token) return token;
    if (!chainId || !address) return undefined;
    if (decimals.loading || symbol.loading || tokenName.loading) return null;
    if (decimals.result) {
      return new Token(
        chainId,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token'),
      );
    }
    return undefined;
  }, [
    address,
    chainId,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result,
  ]);
}

export function useCurrency(currencyId: string | undefined): Token | null | undefined {
  const isESW = currencyId?.toUpperCase() === process.env.REACT_APP_ESW_ID?.toUpperCase();
  const defaultCoin = useDefaultCoin(currencyId);
  const isETH = currencyId?.toUpperCase() === ETHER.address.toUpperCase();
  const token = useToken(isESW || isETH ? undefined : currencyId);
  return isESW ? defaultCoin : isETH ? ETHER : token;
}

export function useDefaultCoin(address?: string): Token | undefined {
  const { chainId } = useActiveWeb3React();
  const defaultCoin = defaultCoins.find(
    (item: any) => item.address.toUpperCase() === address?.toUpperCase(),
  );
  return useMemo(() => {
    if (defaultCoin) {
      return new Token(chainId, address, defaultCoin.decimals, defaultCoin.symbol, defaultCoin.name);
    }
    return undefined;
  }, [address, chainId, defaultCoin]);
}