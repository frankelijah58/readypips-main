"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  BarChart3,
  Menu,
  X,
  AreaChart,
  Copy,
  MoreVertical,
  HelpCircle,
  MessageSquare,
  Shield,
  FileText,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CreditDisplay } from "@/components/credit-display";

type UserRole = "partner" | "affiliate" | "admin";


export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const navigationItems = [
    // {
    //   name: "Live Chart",
    //   href: "/chart",
    //   icon: Activity,
    //   description: "Real-time trading chart",
    // },
    {
      name: "Signals",
      href: "/signals",
      icon: TrendingUp,
      description: "Trading signals & alerts",
    },
    {
      name: "Copy Trading",
      href: "/copy-trading",
      icon: Copy,
      description: "Copy expert traders",
    },
    // {
    //   name: "Charts",
    //   href: "/charts",
    //   icon: BarChart3,
    //   description: "Advanced charts",
    // },
  ];

  const roleBasedItems = [
    {
      name: "Partner Dashboard",
      href: "/partner/onboarding",
      icon: AreaChart,
      description: "Manage partners & performance",
      roles: ["partner", "admin"] as UserRole[],
    },
    {
      name: "Affiliate Dashboard",
      href: "/affiliate/onboarding",
      icon: TrendingUp,
      description: "Track referrals & earnings",
      roles: ["affiliate", "admin"] as UserRole[],
    },
  ];

  // const gatedItems = [
  //   {
  //     name: "Partner/Affliate",
  //     href: "/partner/onboarding",
  //     icon: AreaChart,
  //     description: "Partner dashboard",
  //   },
    // {
    //   name: "Affiliates",
    //   href: "/affiliates",
    //   icon: BarChart3,
    //   description: "Affiliate earnings & links",
    // },
  // ];

  const gatedItems = [
    {
      name: "Partner / Affiliate",
      icon: AreaChart,
      description: "Partner & affiliate dashboard",
    },
  ];

  const resolvePartnerAffiliatePath = () => {
    if (!user) return "/login";

    switch (user.role) {
      case "partner":
        return user.partnerProfile?.isApproved === true
          ? "/partner/dashboard"
          : "/partner/pending";

      case "affiliate":
        return user.affiliateProfile?.isActive === true
          ? "/affiliate/dashboard"
          : "/affiliate/pending";

      case "admin":
        return "/admin/partners";

      default:
        return "/partner/onboarding";
    }
  };

  const moreItems = [
    {
      name: "Support",
      href: "/support",
      icon: HelpCircle,
    },
    {
      name: "FAQs",
      href: "/faqs",
      icon: HelpCircle,
    },
    {
      name: "Testimonials",
      href: "/testimonials",
      icon: MessageSquare,
    },
    {
      name: "Privacy Policy",
      href: "/privacy-policy",
      icon: Shield,
    },
    {
      name: "Terms & Conditions",
      href: "/terms-conditions",
      icon: FileText,
    },
  ];

  const isActive = (href: string) => pathname === href;

  const handleProtectedNavigation = (href: string) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/login");
      return;
    }

    router.push(href);
  };

  const handleRoleNavigation = (href: string, roles: UserRole[]) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push(`/login?redirect=${href}`);
      return;
    }

    if (!roles.includes(user.role as UserRole)) {
      toast.error("You don’t have access to this page");
      return;
    }

    router.push(href);
  };

  const handlePartnerAffiliateNavigation = () => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/login?redirect=/partner");
      return;
    }

    const destination = resolvePartnerAffiliatePath();
    router.push(destination);
  };

  const partnerLabel = user
  ? user.role === "affiliate"
    ? "Affiliate Dashboard"
    : "Partner Dashboard"
  : "Partner / Affiliate";


  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <div className="relative h-8">
              <img
                src="/readypips_ico.png"
                alt="Ready Pips Logo"
                className="h-8 w-auto dark:hidden"
              />
              <img
                src="/logo-dark.png"
                alt="Ready Pips Logo"
                className="h-8 w-auto hidden dark:block"
              />
            </div>
          </Link>


        </div>

        {/* Main Navigation */}
        <div className="flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    isActive(item.href)
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}

          {gatedItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  // variant={isActive(item.href) ? "default" : "ghost"}
                  variant={"ghost"}
                  size="sm"
                  onClick={() => handlePartnerAffiliateNavigation()}//handleProtectedNavigation(item.href)}
                  // className={`flex items-center space-x-2 ${
                  //   isActive(item.href)
                  //     ? "bg-green-600 hover:bg-green-700 text-white"
                  //     : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  // }`}
                  className="flex items-center space-x-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Button>
              );
            })}


            {/* {roleBasedItems.map((item) => {
                const Icon = item.icon;
                const hasAccess = user && item.roles.includes(user.role as UserRole);

                return (
                  <Button
                    key={item.name}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleRoleNavigation(item.href, item.roles)}
                    disabled={!!user && !hasAccess}
                    className={`flex items-center space-x-2 ${
                      isActive(item.href)
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    } ${!hasAccess && user ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                );
              })} */}



          {/* More Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span>More</span>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Resources</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <DropdownMenuItem className="cursor-pointer flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </DropdownMenuItem>
                  </Link>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          {user && <CreditDisplay />}

          {user ? (
            <>
              {/* User avatar circle with initials and link to profile */}
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-medium">
                    {user.firstName && user.lastName
                      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                      : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start leading-tight text-left ">
                  <span className=" hidden sm:inline ">{user.firstName || user.email}</span>
                  <span className=" hidden sm:inline text-sm text-slate-500">{partnerLabel}</span>
                  </div>

                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center">
            <div className="relative h-8">
              <img
                src="/logo-dark.png"
                alt="Ready Pips Logo"
                className="h-8 w-auto"
              />
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
            {user && <CreditDisplay />}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-black dark:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="px-4 pb-4 space-y-2 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive(item.href)
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}

            {gatedItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    // handleProtectedNavigation(item.href);
                    handlePartnerAffiliateNavigation();
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </Button>
              );
            })}


            {/* {roleBasedItems.map((item) => {
              const Icon = item.icon;

              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start text-black dark:text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRoleNavigation(item.href, item.roles);
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </Button>
              );
            })} */}



            {/* More Items in Mobile */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2 py-1">More</div>
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              {user ? (
                <>
                  {/* Profile Link */}
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-medium text-xs mr-2">
                        {user.firstName && user.lastName
                          ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                          : user.email.charAt(0).toUpperCase()}
                      </div>
                      Profile
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
