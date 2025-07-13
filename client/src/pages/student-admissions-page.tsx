import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  GraduationCap, 
  Plus, 
  FileText, 
  CreditCard, 
  Users, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Send,
  UserPlus
} from "lucide-react";

// Application form schema
const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  countryCode: z.string().default("+91"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  nationality: z.string().min(1, "Nationality is required"),
  permanentAddress: z.string().min(1, "Permanent address is required"),
  communicationAddress: z.string().optional(),
  preferredCourse: z.string().min(1, "Preferred course is required"),
  preferredBatch: z.string().min(1, "Preferred batch is required"),
  preferredTime: z.string().optional(),
  learningMode: z.string().min(1, "Learning mode is required"),
  educationQualification: z.string().min(1, "Education qualification is required"),
  hearAboutUs: z.string().min(1, "How did you hear about us is required"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const feePaymentSchema = z.object({
  feePlan: z.string().min(1, "Fee plan is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  paidAmount: z.string().min(1, "Paid amount is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  emiBalance: z.string().optional(),
  nextDueDate: z.string().optional(),
  receiptUrl: z.string().optional(),
});

type FeePaymentFormData = z.infer<typeof feePaymentSchema>;

export default function StudentAdmissionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("applications");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showNewApplication, setShowNewApplication] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Queries
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/admin/student-applications"],
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["/api/admin/student-batches"],
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ["/api/admin/fee-structures"],
  });

  const { data: orientationSessions = [] } = useQuery({
    queryKey: ["/api/admin/orientation-sessions"],
  });

  // Forms
  const applicationForm = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      countryCode: "+91",
      gender: "",
      learningMode: "",
      preferredBatch: "",
      hearAboutUs: "",
    },
  });

  const paymentForm = useForm<FeePaymentFormData>({
    resolver: zodResolver(feePaymentSchema),
  });

  // Mutations
  const createApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const response = await apiRequest("POST", "/api/admin/student-applications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-applications"] });
      setShowNewApplication(false);
      applicationForm.reset();
      toast({
        title: "Application created",
        description: "Student application has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/student-applications/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-applications"] });
      toast({
        title: "Status updated",
        description: "Application status has been updated successfully.",
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/fee-payments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-applications"] });
      setShowPaymentModal(false);
      paymentForm.reset();
      toast({
        title: "Payment recorded",
        description: "Fee payment has been recorded successfully.",
      });
    },
  });

  const generateStudentIdMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest("POST", `/api/admin/student-applications/${applicationId}/generate-student-id`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-applications"] });
      toast({
        title: "Student ID generated",
        description: "Student ID and login credentials have been created.",
      });
    },
  });

  const sendWelcomeEmailMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest("POST", `/api/admin/student-applications/${applicationId}/send-welcome-email`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome email sent",
        description: "Welcome email with credentials has been sent to the student.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      documents_pending: { color: "bg-blue-100 text-blue-800", label: "Docs Pending" },
      payment_pending: { color: "bg-orange-100 text-orange-800", label: "Payment Pending" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const onSubmitApplication = (data: ApplicationFormData) => {
    createApplicationMutation.mutate(data);
  };

  const onSubmitPayment = (data: FeePaymentFormData) => {
    if (!selectedApplication) return;
    
    const totalAmount = parseFloat(data.totalAmount);
    const paidAmount = parseFloat(data.paidAmount);
    const pendingAmount = totalAmount - paidAmount;
    
    createPaymentMutation.mutate({
      ...data,
      applicationId: selectedApplication.id,
      totalAmount: totalAmount.toString(),
      paidAmount: paidAmount.toString(),
      pendingAmount: pendingAmount.toString(),
      paymentStatus: paidAmount >= totalAmount ? "paid" : "partial",
    });
  };

  const handleStatusChange = (applicationId: number, newStatus: string) => {
    updateApplicationStatusMutation.mutate({ id: applicationId, status: newStatus });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Admissions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage student applications, payments, and onboarding
          </p>
        </div>
        <Dialog open={showNewApplication} onOpenChange={setShowNewApplication}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Application Form</DialogTitle>
            </DialogHeader>
            <Form {...applicationForm}>
              <form onSubmit={applicationForm.handleSubmit(onSubmitApplication)} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={applicationForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter middle name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={applicationForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email ID</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <FormField
                        control={applicationForm.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input placeholder="+91" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={applicationForm.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter mobile number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={applicationForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter nationality" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={applicationForm.control}
                      name="permanentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permanent Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter permanent address" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="communicationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Communication Address (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter communication address" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Course Preferences */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Course Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={applicationForm.control}
                      name="preferredCourse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Course/Program</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter preferred course" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="preferredBatch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Batch Timing</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select batch timing" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">Morning</SelectItem>
                              <SelectItem value="evening">Evening</SelectItem>
                              <SelectItem value="weekend">Weekend</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={applicationForm.control}
                      name="preferredTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Time Preference (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 9:00 AM - 12:00 PM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="learningMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode of Learning</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select learning mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={applicationForm.control}
                      name="educationQualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education Qualification</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter education qualification details" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applicationForm.control}
                      name="hearAboutUs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How did you hear about us?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="referral">Referral</SelectItem>
                              <SelectItem value="ads">Advertisements</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="student">Current Student</SelectItem>
                              <SelectItem value="social_media">Social Media</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewApplication(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createApplicationMutation.isPending}
                  >
                    {createApplicationMutation.isPending ? "Creating..." : "Create Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="orientation">Orientation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Student Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application: any) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.firstName} {application.lastName}
                        </TableCell>
                        <TableCell>{application.email}</TableCell>
                        <TableCell>{application.preferredCourse}</TableCell>
                        <TableCell>{getStatusBadge(application.applicationStatus)}</TableCell>
                        <TableCell>
                          {new Date(application.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(application);
                                setActiveTab("payments");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(application.id, "approved")}
                              disabled={application.applicationStatus === "approved"}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateStudentIdMutation.mutate(application.id)}
                              disabled={!!application.studentId}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Fee Payments
              </CardTitle>
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={!selectedApplication}
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </CardHeader>
            <CardContent>
              {selectedApplication ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">
                      {selectedApplication.firstName} {selectedApplication.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Course: {selectedApplication.preferredCourse}
                    </p>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Plan</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Paid Amount</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedApplication.feePayments?.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.feePlan}</TableCell>
                            <TableCell>₹{parseFloat(payment.totalAmount).toLocaleString()}</TableCell>
                            <TableCell>₹{parseFloat(payment.paidAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>₹{parseFloat(payment.pendingAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(payment.paymentStatus)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No payments recorded yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select an application to view payment details
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Modal */}
          <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Fee Payment</DialogTitle>
              </DialogHeader>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="feePlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Plan</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fee plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="one-time">One-time Payment</SelectItem>
                              <SelectItem value="installment">Installment</SelectItem>
                              <SelectItem value="scholarship">Scholarship</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter total amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paid Amount (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter paid amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Credit/Debit Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="emiBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EMI Balance (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Remaining EMI balance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="nextDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Upload Receipt (if offline payment)
                      </p>
                      <Button type="button" variant="outline" size="sm" className="mt-2">
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPaymentMutation.isPending}>
                      {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                    </Button>
                    <Button type="button" variant="secondary">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Invoice
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Batches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Batch management interface will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orientation Tab */}
        <TabsContent value="orientation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Orientation Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Orientation session management will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Admission Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Fee structures and admission settings will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}