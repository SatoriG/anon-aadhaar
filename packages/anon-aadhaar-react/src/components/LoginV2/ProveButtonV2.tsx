import { AnonAadhaarPCDArgs } from 'anon-aadhaar-pcd'
import { ArgumentTypeName } from '@pcd/pcd-types'
import styled from 'styled-components'
import { useContext } from 'react'
import { AnonAadhaarContext } from '../../hooks/useAnonAadhaar'
import { Spinner } from '../LoadingSpinner'
import { AadhaarSignatureValidition, Witness } from '../../interface'
import React from 'react'
import { extractWitness } from '../../extractWitness'

interface ProveButtonProps {
  pdfData: Buffer
  password: string
  signatureValidity: AadhaarSignatureValidition | ''
}

export const ProveButtonV2: React.FC<ProveButtonProps> = ({
  pdfData,
  password,
  signatureValidity,
}) => {
  const { state, startReq } = useContext(AnonAadhaarContext)

  const startProving = async () => {
    try {
      const witness: Witness = await extractWitness(pdfData, password)

      if (
        witness.modulusBigInt === BigInt(0) &&
        witness.msgBigInt === BigInt(0) &&
        witness.sigBigInt === BigInt(0)
      )
        throw new Error('Error while generating the witness')

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
          value: witness?.modulusBigInt.toString(),
          description: '',
        },
      }

      startReq({ type: 'login', args })
    } catch (error) {
      console.log(error)
    }
  }

  return (() => {
    switch (state.status) {
      case 'logged-out':
        return (
          <Btn
            disabled={
              !(signatureValidity == AadhaarSignatureValidition.SIGNATURE_VALID)
            }
            onClick={startProving}
          >
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
  margin-top: 1rem;

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