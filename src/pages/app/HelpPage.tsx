import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Book, MessageCircle, Mail, ExternalLink, FileText, Video, Users } from 'lucide-react';

export default function HelpPage() {
  const resources = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      action: 'View Docs',
      href: '#',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      action: 'Watch Now',
      href: '#',
    },
    {
      icon: FileText,
      title: 'API Reference',
      description: 'Technical documentation for developers',
      action: 'View API',
      href: '#',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with other users and share tips',
      action: 'Join Community',
      href: '#',
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      availability: 'Available Mon-Fri, 9am-5pm',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message',
      availability: 'Response within 24 hours',
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
      answer: 'Yes, most modules support data export. Look for the export button in the relevant section.',
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

      {/* Resources */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource) => (
            <Card key={resource.title} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
                  <resource.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base mt-2">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{resource.description}</CardDescription>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  {resource.action}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
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
            <Card key={option.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <option.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{option.availability}</p>
                <Button variant="secondary" size="sm" disabled>
                  Coming Soon
                </Button>
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
