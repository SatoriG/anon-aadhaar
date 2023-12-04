import { AnonAadhaarPCDArgs } from 'anon-aadhaar-pcd'
import { ArgumentTypeName } from '@pcd/pcd-types'
import styled from 'styled-components'
import { Dispatch, useContext, SetStateAction } from 'react'
import { AnonAadhaarContext } from '../hooks/useAnonAadhaar'
import { Spinner } from './LoadingSpinner'
import React from 'react'
import { extractWitness, fetchPublicKey } from 'anon-aadhaar-pcd'
import { Buffer } from 'buffer'

interface ProveButtonProps {
  pdfData: Buffer
  password: string
  provingEnabled: boolean
  setErrorMessage: Dispatch<SetStateAction<string | null>>
}

export const ProveButton: React.FC<ProveButtonProps> = ({
  pdfData,
  password,
  provingEnabled,
  setErrorMessage,
}) => {
  const { state, startReq, appId, testing } = useContext(AnonAadhaarContext)

  const startProving = async () => {
    try {
      if (appId === null) throw new Error('Missing application Id!')

      const witness = await extractWitness(pdfData, password)

      if (witness instanceof Error) throw new Error(witness.message)

      let publicKey = ''

      if (!testing) {
        const result = await fetchPublicKey(
          'https://www.uidai.gov.in/images/authDoc/uidai_offline_publickey_26022021.cer',
        )
        if (result === null) {
          throw new Error('Error while fetching the public key!')
        } else {
          publicKey = result
        }
      }

      const args: AnonAadhaarPCDArgs = {
        base_message: {
          argumentType: ArgumentTypeName.BigInt,
          userProvided: false,
          value: witness?.msgBigInt.toString(),
          description: '',
        },
        signature: {
          argumentType: ArgumentTypeName.BigInt,
          userProvided: false,
          value: witness?.sigBigInt.toString(),
          description: '',
        },
        modulus: {
          argumentType: ArgumentTypeName.BigInt,
          userProvided: false,
          value: testing ? witness.modulusBigInt.toString() : '0x' + publicKey,
          description: '',
        },
        app_id: {
          argumentType: ArgumentTypeName.BigInt,
          userProvided: false,
          value: appId,
          description: '',
        },
      }

      startReq({ type: 'login', args })
    } catch (error) {
      console.log(error)
      if (error instanceof Error) setErrorMessage(error.message)
    }
  }

  return (() => {
    switch (state.status) {
      case 'logged-out':
        return (
          <Btn disabled={!provingEnabled} onClick={startProving}>
            Request Aadhaar Proof
          </Btn>
        )
      case 'logging-in':
        return (
          <Btn>
            Generating proof...
            {'\u2003'}
            <Spinner />
          </Btn>
        )
    }
  })()
}

const Btn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  color: #f8f8f8;
  font-weight: bold;
  box-shadow: 0px 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
  border: none;
  min-width: 12rem;
  min-height: 3rem;
  border-radius: 0.5rem;
  background: linear-gradient(345deg, #10fe53 0%, #09d3ff 100%);
  margin: 1rem;

  &:hover {
    opacity: 70%;
    background: linear-gradient(345deg, #10fe53 0%, #09d3ff 100%);
  }

  &:active {
    background: #f8f8f8;
  }

  &:disabled {
    color: #a8aaaf;
    background: #e8e8e8;
    cursor: default;
  }
`
