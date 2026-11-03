import React from 'react';
import { ActionAlertModal } from '../../../components/common/ActionAlertModal';
import type { ModalAlertState } from '../types';

interface MemberAlertModalProps {
  modalAlert: ModalAlertState;
  onClose: () => void;
}

export const MemberAlertModal: React.FC<MemberAlertModalProps> = ({ modalAlert, onClose }) => {
  return <ActionAlertModal modalAlert={modalAlert} onClose={onClose} />;
};
