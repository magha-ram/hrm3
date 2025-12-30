import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Book, MessageCircle, Mail, FileText, Video, Users, Clock, Info } from 'lucide-react';

export default function HelpPage() {
  const resources = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      status: 'coming_soon',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      status: 'coming_soon',
    },
    {
      icon: FileText,
      title: 'API Reference',
      description: 'Technical documentation for developers',
      status: 'enterprise',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with other users and share tips',
      status: 'coming_soon',
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      availability: 'Coming Soon',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message for assistance',
      availability: 'Coming Soon',
    },
  ];

  const faqs = [
    {
      question: 'How do I add a new employee?',
      answer: 'Navigate to the Employees section and click "Add Employee". Fill in the required information and save.',
    },
    {
      question: 'How do I submit a leave request?',
      answer: 'Go to Leave Management, click "Request Leave", select your dates and leave type, then submit for approval.',
    },
    {
      question: 'How do I change my subscription plan?',
      answer: 'Visit Settings > Billing to view available plans and upgrade or downgrade your subscription.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes, most modules support data export. Look for the "Export" button in sections like Audit Logs and Compliance.',
    },
    {
      question: 'How do I invite team members?',
      answer: 'Go to Settings > Users & Roles, click "Invite User", enter their email and select their role.',
    },
    {
      question: 'How do I manage user permissions?',
      answer: 'User permissions are based on roles. Admins can change user roles in Settings > Users & Roles.',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Help & Support
        </h1>
        <p className="text-muted-foreground">Get help with using the HR Portal</p>
      </div>

      {/* Info Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Support Resources Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                We're building out our help center and support channels. In the meantime, 
                check the FAQs below for quick answers to common questions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource) => (
            <Card key={resource.title} className="opacity-75">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                    <resource.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {resource.status === 'enterprise' ? 'Enterprise' : 'Coming Soon'}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{resource.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Support Options */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Contact Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportOptions.map((option) => (
            <Card key={option.title} className="opacity-75">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <option.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {option.availability}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
              <h4 className="font-medium mb-1">{faq.question}</h4>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
