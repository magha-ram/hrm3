import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  HelpCircle,
  BookOpen,
  PlayCircle,
  Rocket,
  Users,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Settings,
  Shield,
  Mail,
  Info,
} from 'lucide-react';
import { HelpSearch } from '@/components/help/HelpSearch';
import { FAQAccordion } from '@/components/help/FAQAccordion';
import { VideoTutorialCard } from '@/components/help/VideoTutorialCard';
import { QuickGuideCard } from '@/components/help/QuickGuideCard';
import { KeyboardShortcuts } from '@/components/help/KeyboardShortcuts';
import { FAQS, VIDEO_TUTORIALS, QUICK_GUIDES, FAQ_CATEGORIES } from '@/config/help-center';
import { useUserRole } from '@/hooks/useUserRole';
import type { AppRole } from '@/types/auth';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'getting-started': Rocket,
  employees: Users,
  leave: Calendar,
  time: Clock,
  payroll: DollarSign,
  documents: FileText,
  settings: Settings,
  security: Shield,
};

function canViewContent(userRole: AppRole | null, requiredRoles?: AppRole[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;
  
  const roleHierarchy: AppRole[] = ['employee', 'manager', 'hr_manager', 'company_admin', 'super_admin'];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  
  return requiredRoles.some(requiredRole => {
    const requiredIndex = roleHierarchy.indexOf(requiredRole);
    return userRoleIndex >= requiredIndex;
  });
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { role: userRole } = useUserRole();

  // Filter FAQs based on search, category, and role
  const filteredFAQs = useMemo(() => {
    return FAQS.filter((faq) => {
      // Role check
      if (!canViewContent(userRole, faq.roles)) return false;

      // Category filter
      if (selectedCategory && faq.category !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          faq.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory, userRole]);

  // Filter videos based on role
  const filteredVideos = useMemo(() => {
    return VIDEO_TUTORIALS.filter((video) => canViewContent(userRole, video.roles));
  }, [userRole]);

  // Filter guides based on role
  const filteredGuides = useMemo(() => {
    return QUICK_GUIDES.filter((guide) => canViewContent(userRole, guide.roles));
  }, [userRole]);

  // Group FAQs by category for the category view
  const faqsByCategory = useMemo(() => {
    const grouped: Record<string, typeof FAQS> = {};
    FAQ_CATEGORIES.forEach((cat) => {
      grouped[cat.id] = filteredFAQs.filter((faq) => faq.category === cat.id);
    });
    return grouped;
  }, [filteredFAQs]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Help Center
          </h1>
          <p className="text-muted-foreground">
            Find answers, watch tutorials, and learn how to use the HR Portal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:support@example.com">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-center mb-2">How can we help you?</h2>
            <HelpSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search FAQs, guides, and tutorials..."
            />
            {searchQuery && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="faqs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Guides</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Videos</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Category Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <Button
                      variant={selectedCategory === null ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Topics
                      <Badge variant="outline" className="ml-auto">
                        {filteredFAQs.length}
                      </Badge>
                    </Button>
                    {FAQ_CATEGORIES.map((category) => {
                      const Icon = CATEGORY_ICONS[category.id] || HelpCircle;
                      const count = faqsByCategory[category.id]?.length || 0;
                      if (count === 0 && selectedCategory !== category.id) return null;
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {category.label}
                          <Badge variant="outline" className="ml-auto">
                            {count}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              <div className="mt-4 hidden lg:block">
                <KeyboardShortcuts />
              </div>
            </div>

            {/* FAQ List */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedCategory
                      ? FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'FAQs'
                      : 'Frequently Asked Questions'}
                  </CardTitle>
                  <CardDescription>
                    {selectedCategory
                      ? `Questions about ${FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.label.toLowerCase()}`
                      : 'Browse all help topics or use search to find specific answers'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FAQAccordion faqs={filteredFAQs} searchQuery={searchQuery} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Quick Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Guides</CardTitle>
                  <CardDescription>
                    Step-by-step instructions for common tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGuides.map((guide) => (
                      <QuickGuideCard key={guide.id} guide={guide} />
                    ))}
                  </div>
                  {filteredGuides.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No guides available for your role.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-4">
              {/* Getting Started Card */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">New to HR Portal?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start with the "Getting Started" guide to learn the basics, then
                        explore guides specific to your role.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <KeyboardShortcuts />
            </div>
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Watch step-by-step video guides for each module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <VideoTutorialCard key={video.id} video={video} />
                ))}
              </div>
              {filteredVideos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No video tutorials available yet.</p>
                  <p className="text-sm mt-1">Check back soon for new content!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coming Soon */}
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">
                More video tutorials are being added regularly. Have a suggestion?{' '}
                <a href="mailto:support@example.com" className="text-primary hover:underline">
                  Let us know!
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
