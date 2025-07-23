"use client";

import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  CalendarIcon,
  PencilSquareIcon,
  StarIcon,
  BriefcaseIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/20/solid";
import Image from "next/image";

export const navigation = [
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Take a Note", href: "#", icon: PencilSquareIcon },
  { name: "First Pro", href: "#", icon: StarIcon },
  { name: "Deep Work", href: "#", icon: BriefcaseIcon },
  { name: "Shallow Work", href: "#", icon: ChartBarIcon },
  { name: "Question", href: "/question", icon: QuestionMarkCircleIcon },
  { name: "Learn", href: "#", icon: AcademicCapIcon },
  { name: "News", href: "#", icon: NewspaperIcon },
];

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile sidebar */}
      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="m-2 p-2 text-white"
        >
          <Bars3Icon className="size-6" />
        </button>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 ring-1 ring-white/10">
                <div className="flex h-16 shrink-0 items-center">
                  <Image
                    alt="Dashboard Logo"
                    src="/logo.png"
                    width={32}
                    height={32}
                    className="h-8 w-auto"
                  />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className={classNames(
                                'text-gray-400 hover:bg-gray-800 hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold',
                              )}
                            >
                              <item.icon aria-hidden="true" className="size-6 shrink-0" />
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </div>
      {/* Desktop sidebar */}
      <div className={classNames(
        "hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:flex-col transition-all duration-300",
        collapsed ? "xl:w-16" : "xl:w-72"
      )}>
        <div className={classNames(
          "flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 ring-1 ring-white/5 transition-all duration-300",
          collapsed ? "items-center px-2" : "px-6"
        )}>
          <div className={classNames(
            "flex h-16 shrink-0 items-center w-full",
            collapsed ? "justify-center" : "justify-between"
          )}>
            <Image
              alt="Dashboard Logo"
              src="/logo.png"
              width={32}
              height={32}
              className={classNames("h-8 transition-all duration-300", collapsed ? "w-8" : "w-auto")}
            />
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className={classNames("p-2 text-white transition-all duration-300", collapsed ? "ml-0" : "ml-2")}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{ minWidth: 0 }}
            >
              <span className="sr-only">{collapsed ? "Expand" : "Collapse"} sidebar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col w-full">
            <ul role="list" className="flex flex-1 flex-col gap-y-7 w-full">
              <li>
                <ul role="list" className="-mx-2 space-y-1 w-full">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={classNames(
                          'text-gray-400 hover:bg-gray-800 hover:text-white',
                          'group flex items-center rounded-md p-2 text-sm font-semibold transition-all duration-300',
                          collapsed ? 'justify-center w-12 mx-auto' : 'gap-x-3 w-full'
                        )}
                        title={item.name}
                      >
                        <item.icon aria-hidden="true" className="size-6 shrink-0" />
                        {!collapsed && <span className="ml-2">{item.name}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
} 