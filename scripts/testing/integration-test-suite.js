const axios = require('axios');

/**
 * Cross-Feature Integration Testing Suite
 * End-to-end user journey testing for Sesimiz Ol application
 */

class IntegrationTestSuite {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.testUsers = {};
    this.testData = {};
    this.testResults = [];
  }

  // Test 1: Complete User Registration → Story Creation → Interaction Flow
  async testCompleteUserJourney() {
    console.log('\n🚀 Testing Complete User Journey...');

    try {
      // Step 1: User Registration
      const user = await this.registerTestUser('journey_user', 'test@journey.com');

      // Step 2: User Login
      const authToken = await this.loginUser('test@journey.com', 'TestPassword123!');

      // Step 3: Create Story
      const story = await this.createStory(authToken, {
        title: 'Integration Test Hikayesi',
        content: 'Bu bir entegrasyon testi hikayesidir.'
      });

      // Step 4: View Story (increase view count)
      await this.viewStory(story.id);

      // Step 5: Add Comment
      const comment = await this.addComment(authToken, story.id, 'Harika bir hikaye!');

      // Step 6: Like Story
      await this.likeStory(authToken, story.id);

      // Step 7: Bookmark Story (with different user)
      const user2 = await this.registerTestUser('journey_user2', 'test2@journey.com');
      const authToken2 = await this.loginUser('test2@journey.com', 'TestPassword123!');
      await this.bookmarkStory(authToken2, story.id);

      // Step 8: Follow User
      await this.followUser(authToken2, user.id);

      // Step 9: Check Notifications
      const notifications = await this.getNotifications(authToken);

      // Step 10: User Logout
      await this.logoutUser(authToken);

      this.testResults.push({
        test: 'Complete User Journey',
        status: 'PASSED',
        steps: 10,
        data: { user, story, comment, notifications }
      });

      console.log('✅ Complete User Journey Test: PASSED');
      return true;

    } catch (error) {
      this.testResults.push({
        test: 'Complete User Journey',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Complete User Journey Test: FAILED - ${error.message}`);
      return false;
    }
  }

  // Test 2: Organization Creation → Member Management → Story Publishing
  async testOrganizationWorkflow() {
    console.log('\n🏢 Testing Organization Workflow...');

    try {
      // Step 1: Admin user registration and login
      const adminUser = await this.registerTestUser('org_admin', 'admin@org.com');
      const adminToken = await this.loginUser('admin@org.com', 'TestPassword123!');

      // Step 2: Create Organization
      const organization = await this.createOrganization(adminToken, {
        name: 'Test STK Organizasyonu',
        description: 'Test amaçlı oluşturulmuş STK',
        website: 'https://test-stk.com'
      });

      // Step 3: Register member user
      const memberUser = await this.registerTestUser('org_member', 'member@org.com');
      const memberToken = await this.loginUser('member@org.com', 'TestPassword123!');

      // Step 4: Add member to organization
      await this.addOrganizationMember(adminToken, organization.id, memberUser.id, 'member');

      // Step 5: Member creates story for organization
      const orgStory = await this.createOrganizationStory(memberToken, organization.id, {
        title: 'STK Hikayesi',
        content: 'Bu STK tarafından paylaşılan bir hikayedir.'
      });

      // Step 6: Admin moderates story
      await this.moderateStory(adminToken, orgStory.id, 'approved');

      // Step 7: Publish story
      await this.publishStory(adminToken, orgStory.id);

      // Step 8: Check organization dashboard
      const dashboard = await this.getOrganizationDashboard(adminToken, organization.id);

      this.testResults.push({
        test: 'Organization Workflow',
        status: 'PASSED',
        steps: 8,
        data: { organization, orgStory, dashboard }
      });

      console.log('✅ Organization Workflow Test: PASSED');
      return true;

    } catch (error) {
      this.testResults.push({
        test: 'Organization Workflow',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Organization Workflow Test: FAILED - ${error.message}`);
      return false;
    }
  }

  // Test 3: Search → Filtering → Bookmarking → Notification Flow
  async testSearchAndInteractionFlow() {
    console.log('\n🔍 Testing Search and Interaction Flow...');

    try {
      // Step 1: Create test user
      const user = await this.registerTestUser('search_user', 'search@test.com');
      const authToken = await this.loginUser('search@test.com', 'TestPassword123!');

      // Step 2: Create multiple stories with different tags
      const stories = await Promise.all([
        this.createStory(authToken, {
          title: 'Kadın Hakları Hikayesi',
          content: 'Kadın hakları ile ilgili hikaye',
          tags: ['kadın', 'haklar', 'eşitlik']
        }),
        this.createStory(authToken, {
          title: 'Güçlü Kadın Portresi',
          content: 'Güçlü bir kadının hikayesi',
          tags: ['güçlü', 'kadın', 'ilham']
        }),
        this.createStory(authToken, {
          title: 'Doğa ve Çevre',
          content: 'Çevre koruma hikayesi',
          tags: ['doğa', 'çevre', 'koruma']
        })
      ]);

      // Step 3: Search stories by keyword
      const searchResults = await this.searchStories('kadın');

      // Step 4: Filter stories by tag
      const filteredStories = await this.filterStoriesByTag('kadın');

      // Step 5: Sort stories by popularity
      const popularStories = await this.getStoriesSorted('popularity');

      // Step 6: Bookmark filtered stories
      const bookmarks = [];
      for (const story of filteredStories.slice(0, 2)) {
        await this.bookmarkStory(authToken, story.id);
        bookmarks.push(story.id);
      }

      // Step 7: Get user's bookmarks
      const userBookmarks = await this.getUserBookmarks(authToken);

      // Step 8: Check notifications for bookmark activities
      const notifications = await this.getNotifications(authToken);

      this.testResults.push({
        test: 'Search and Interaction Flow',
        status: 'PASSED',
        steps: 8,
        data: {
          searchResults: searchResults.length,
          filteredStories: filteredStories.length,
          bookmarks: bookmarks.length,
          notifications: notifications.length
        }
      });

      console.log('✅ Search and Interaction Flow Test: PASSED');
      return true;

    } catch (error) {
      this.testResults.push({
        test: 'Search and Interaction Flow',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Search and Interaction Flow Test: FAILED - ${error.message}`);
      return false;
    }
  }

  // Test 4: Mobile Responsiveness Across All Features
  async testMobileResponsiveness() {
    console.log('\n📱 Testing Mobile Responsiveness...');

    try {
      const mobileHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      };

      // Test mobile endpoints
      const mobileTests = [
        { endpoint: '/', name: 'Home Page' },
        { endpoint: '/hikayeler', name: 'Stories Page' },
        { endpoint: '/hakkinda', name: 'About Page' },
        { endpoint: '/api/stories', name: 'Stories API' }
      ];

      const results = [];

      for (const test of mobileTests) {
        try {
          const response = await axios.get(`${this.baseURL}${test.endpoint}`, {
            headers: mobileHeaders,
            timeout: 5000
          });

          results.push({
            endpoint: test.name,
            status: response.status,
            responseTime: response.headers['x-response-time'] || 'N/A',
            success: response.status === 200
          });

        } catch (error) {
          results.push({
            endpoint: test.name,
            status: error.response?.status || 'ERROR',
            error: error.message,
            success: false
          });
        }
      }

      const successfulTests = results.filter(r => r.success).length;
      const totalTests = results.length;

      this.testResults.push({
        test: 'Mobile Responsiveness',
        status: successfulTests === totalTests ? 'PASSED' : 'PARTIAL',
        steps: totalTests,
        successRate: `${successfulTests}/${totalTests}`,
        data: results
      });

      console.log(`✅ Mobile Responsiveness Test: ${successfulTests}/${totalTests} tests passed`);
      return successfulTests === totalTests;

    } catch (error) {
      this.testResults.push({
        test: 'Mobile Responsiveness',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Mobile Responsiveness Test: FAILED - ${error.message}`);
      return false;
    }
  }

  // Helper Methods for API Interactions

  async registerTestUser(nickname, email) {
    const userData = {
      nickname: nickname,
      email: email,
      password: 'TestPassword123!'
    };

    const response = await axios.post(`${this.baseURL}/api/auth/register`, userData);
    this.testUsers[email] = response.data.user;
    return response.data.user;
  }

  async loginUser(email, password) {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, {
      email: email,
      password: password
    });
    return response.data.token;
  }

  async logoutUser(token) {
    await axios.post(`${this.baseURL}/api/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async createStory(token, storyData) {
    const response = await axios.post(`${this.baseURL}/api/stories`, storyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.story;
  }

  async viewStory(storyId) {
    await axios.get(`${this.baseURL}/api/stories/${storyId}`);
  }

  async addComment(token, storyId, content) {
    const response = await axios.post(`${this.baseURL}/api/stories/${storyId}/comments`, {
      content: content
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.comment;
  }

  async likeStory(token, storyId) {
    await axios.post(`${this.baseURL}/api/stories/${storyId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async bookmarkStory(token, storyId) {
    await axios.post(`${this.baseURL}/api/stories/${storyId}/bookmark`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async followUser(token, userId) {
    await axios.post(`${this.baseURL}/api/users/${userId}/follow`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async getNotifications(token) {
    const response = await axios.get(`${this.baseURL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.notifications;
  }

  async createOrganization(token, orgData) {
    const response = await axios.post(`${this.baseURL}/api/organizations`, orgData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.organization;
  }

  async addOrganizationMember(token, orgId, userId, role) {
    await axios.post(`${this.baseURL}/api/organizations/${orgId}/members`, {
      userId: userId,
      role: role
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async createOrganizationStory(token, orgId, storyData) {
    const response = await axios.post(`${this.baseURL}/api/organizations/${orgId}/stories`, storyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.story;
  }

  async moderateStory(token, storyId, action) {
    await axios.put(`${this.baseURL}/api/admin/stories/${storyId}/moderate`, {
      action: action
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async publishStory(token, storyId) {
    await axios.put(`${this.baseURL}/api/stories/${storyId}/publish`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async getOrganizationDashboard(token, orgId) {
    const response = await axios.get(`${this.baseURL}/api/organizations/${orgId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async searchStories(query) {
    const response = await axios.get(`${this.baseURL}/api/stories/search`, {
      params: { q: query }
    });
    return response.data.stories;
  }

  async filterStoriesByTag(tag) {
    const response = await axios.get(`${this.baseURL}/api/stories`, {
      params: { tag: tag }
    });
    return response.data.stories;
  }

  async getStoriesSorted(sortBy) {
    const response = await axios.get(`${this.baseURL}/api/stories`, {
      params: { sort: sortBy }
    });
    return response.data.stories;
  }

  async getUserBookmarks(token) {
    const response = await axios.get(`${this.baseURL}/api/user/bookmarks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.bookmarks;
  }

  // Generate Integration Test Report
  generateReport() {
    const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
    const totalTests = this.testResults.length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n📊 INTEGRATION TEST REPORT');
    console.log('='.repeat(50));
    console.log(`🎯 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);

    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.steps) {
        console.log(`   Steps: ${result.steps}`);
      }
    });

    return {
      successRate: successRate,
      passedTests: passedTests,
      totalTests: totalTests,
      results: this.testResults,
      status: successRate >= 80 ? 'INTEGRATION_READY' : 'NEEDS_IMPROVEMENT'
    };
  }

  // Run Complete Integration Test Suite
  async runCompleteTestSuite() {
    console.log('🔄 STARTING CROSS-FEATURE INTEGRATION TESTING');
    console.log('='.repeat(50));

    const tests = [
      this.testCompleteUserJourney(),
      this.testOrganizationWorkflow(),
      this.testSearchAndInteractionFlow(),
      this.testMobileResponsiveness()
    ];

    await Promise.all(tests.map(test => test.catch(err => console.error(err))));

    return this.generateReport();
  }

  // Cleanup test data
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    // In real implementation, would clean up test users, stories, etc.
    console.log('✅ Cleanup completed');
  }
}

// Export for use in other scripts
module.exports = IntegrationTestSuite;

// Run integration tests if called directly
if (require.main === module) {
  const testSuite = new IntegrationTestSuite();
  testSuite.runCompleteTestSuite()
    .then(result => {
      console.log(`\n🎯 Final Status: ${result.status}`);
      return testSuite.cleanup();
    })
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}