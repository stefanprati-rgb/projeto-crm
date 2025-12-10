import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { TicketDetailsContent } from './TicketDetailsContent';
import { Button } from '../';

/**
 * Drawer/Modal usando Headless UI para animações suaves
 * Ocupa max-w-7xl (1280px) para espaço amplo de trabalho
 */
export const TicketDetailsDrawer = ({ isOpen, onClose, ticket, onUpdate }) => {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Overlay escuro de fundo */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-7xl">
                                    <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-2xl">
                                        {/* Header do Drawer */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                                        {ticket?.protocol}
                                                    </span>
                                                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                        {ticket?.subject}
                                                    </Dialog.Title>
                                                </div>
                                                {ticket?.clientName && (
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        Cliente: <span className="font-medium text-primary-600 dark:text-primary-400">{ticket.clientName}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="ml-3 flex h-7 items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={onClose}
                                                    className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <span className="sr-only">Fechar painel</span>
                                                    <X className="h-5 w-5" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Conteúdo Principal */}
                                        <div className="relative flex-1 overflow-hidden">
                                            {ticket && (
                                                <TicketDetailsContent
                                                    ticket={ticket}
                                                    onUpdate={onUpdate}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
