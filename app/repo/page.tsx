'use client';
import {
  type IssuesData,
  useRepositoryStore,
} from '@/app/store/useRepositoryStore';
import { cn } from '@/lib/utils';
import {
  CheckSquare,
  Code,
  Filter,
  GitBranch,
  Loader2,
  Search,
  SortAsc,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Cloud from '../components/dashboard-components/Cloud';
import SunGlareEffect from '../components/dashboard-components/SunGlareEffect';
import IssueCard from '../components/repo-components/IssueCard';
import RepoCard from '../components/repo-components/RepoCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

/**
 * Randomize array in-place using Durstenfeld shuffle algorithm: Complexity 0(n)
 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type IssueFilterType = 'all' | 'claimed' | 'unclaimed' | 'completed' | 'active';
// type IssueSortType = 'newest' | 'oldest' | 'bounty-high' | 'bounty-low';
type IssueSortType = 'newest' | 'oldest';

const ReposPage = () => {
  const {
    repos: repositories,
    isFetchingRepos,
    isFetchingIssues,
    getAllRepos,
    getIssuesForRepo,
  } = useRepositoryStore();

  const [issues, setIssues] = useState<IssuesData[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'repositories' | 'issues'>(
    'repositories',
  );
  const [issueFilter, setIssueFilter] = useState<IssueFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [issueSort, setIssueSort] = useState<IssueSortType>('newest');

  const [repoSearchTerm, setRepoSearchTerm] = useState('');
  const [repoTechFilter, setRepoTechFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      setIsLoadingRepos(true);
      await getAllRepos();
      setIsLoadingRepos(false);
    };
    fetchRepos();
  }, [getAllRepos]);

  const selectedRepo = repositories.find((repo) => repo.id === selectedRepoId);

  const handleRepoSelect = (repoId: string) => {
    setSelectedRepoId(repoId);
    if (window.innerWidth < 768) {
      setActiveTab('issues');
    }
  };

  const clearSelection = () => {
    setSelectedRepoId(null);
    if (window.innerWidth < 768) {
      setActiveTab('repositories');
    }
  };

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoadingIssues(true);
      if (selectedRepoId) {
        const data = await getIssuesForRepo(selectedRepoId);
        setIssues(data);
      } else {
        setIssues([]);
      }
      setIsLoadingIssues(false);
    };
    fetchIssues();
  }, [selectedRepoId, getIssuesForRepo]);

  const filteredRepositories = useMemo(() => {
    let filtered = [...repositories];

    // Apply search filter
    if (repoSearchTerm.trim()) {
      const lower = repoSearchTerm.toLowerCase();
      filtered = filtered.filter((repo) =>
        repo.name.toLowerCase().includes(lower),
      );
    }

    // Apply tech filter
    if (repoTechFilter) {
      filtered = filtered.filter((repo) =>
        repo.tech?.some(
          (tech: string) => tech.toLowerCase() === repoTechFilter.toLowerCase(),
        ),
      );
    }

    // Always shuffle the repositories
    filtered = shuffleArray(filtered);

    return filtered;
  }, [repositories, repoSearchTerm, repoTechFilter]);

  const allRepoTechs = useMemo(() => {
    const techSet = new Set<string>();
    for (const repo of repositories) {
      if (Array.isArray(repo.tech)) {
        for (const tech of repo.tech) {
          techSet.add(tech);
        }
      }
    }
    return Array.from(techSet).sort();
  }, [repositories]);

  const filteredIssues = useMemo(() => {
    if (!issues) return [];

    let filtered = [...issues];

    switch (issueFilter) {
      case 'claimed':
        filtered = filtered.filter((issue) => issue.isClaimed);
        break;
      case 'unclaimed':
        filtered = filtered.filter((issue) => !issue.isClaimed);
        break;
      case 'completed':
        filtered = filtered.filter((issue) => issue.completionStatus);
        break;
      case 'active':
        filtered = filtered.filter((issue) => !issue.completionStatus);
        break;
    }

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(lowerSearchTerm) ||
          issue.language.some((lang) =>
            lang.toLowerCase().includes(lowerSearchTerm),
          ),
      );
    }

    switch (issueSort) {
      // case 'bounty-high':
      //   filtered.sort((a, b) => {
      //     const bountyA =
      //       a.multiplierActive && a.multiplierValue
      //         ? a.bounty * a.multiplierValue
      //         : a.bounty;
      //     const bountyB =
      //       b.multiplierActive && b.multiplierValue
      //         ? b.bounty * b.multiplierValue
      //         : b.bounty;
      //     return bountyB - bountyA;
      //   });
      //   break;
      // case 'bounty-low':
      //   filtered.sort((a, b) => {
      //     const bountyA =
      //       a.multiplierActive && a.multiplierValue
      //         ? a.bounty * a.multiplierValue
      //         : a.bounty;
      //     const bountyB =
      //       b.multiplierActive && b.multiplierValue
      //         ? b.bounty * b.multiplierValue
      //         : b.bounty;
      //     return bountyA - bountyB;
      //   });
      //   break;
      case 'oldest':
        filtered.sort((a, b) => a.id.localeCompare(b.id));
        break;
      default:
        filtered.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }

    return filtered;
  }, [issues, issueFilter, searchTerm, issueSort]);

  const filterBadgeText = useMemo(() => {
    switch (issueFilter) {
      case 'claimed':
        return 'Claimed';
      case 'unclaimed':
        return 'Unclaimed';
      case 'completed':
        return 'Completed';
      case 'active':
        return 'Active';
      default:
        return 'All';
    }
  }, [issueFilter]);

  const sortBadgeText = useMemo(() => {
    switch (issueSort) {
      // case 'bounty-high':
      //   return 'Bounty: High to Low';
      // case 'bounty-low':
      //   return 'Bounty: Low to High';
      case 'oldest':
        return 'Oldest First';
      case 'newest':
        return 'Newest First';
      default:
        return 'Newest';
    }
  }, [issueSort]);

  const hasActiveFilters =
    issueFilter !== 'all' || searchTerm || issueSort !== 'newest';

  const resetFilters = () => {
    setIssueFilter('all');
    setSearchTerm('');
    setIssueSort('newest');
  };

  const LoadingRepos = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Loader2 className="mb-2 h-8 w-8 text-gray-600 animate-spin" />
      <p className="text-gray-600">Loading repositories...</p>
    </div>
  );

  const LoadingIssues = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Loader2 className="mb-2 h-8 w-8 text-gray-600 animate-spin" />
      <p className="text-gray-600">Loading issues...</p>
    </div>
  );

  const FilterMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="bg-white/40 cursor-pointer border-white/40 backdrop-blur-sm text-gray-800 hover:bg-white/50 hover:border-white/50 hover:text-gray-700"
        >
          <Filter className="mr-1 h-4 w-4 text-gray-600" />
          <span>Filter</span>
          {issueFilter !== 'all' && (
            <Badge className="ml-2 bg-gray-200 text-gray-800 border-white/30">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white/20 border-white/30 backdrop-blur-md text-gray-800">
        <DropdownMenuLabel className="text-gray-700">
          Filter Issues
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/30" />
        <DropdownMenuItem
          onClick={() => setIssueFilter('all')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueFilter === 'all' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">All Issues</span>
          {issueFilter === 'all' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setIssueFilter('claimed')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueFilter === 'claimed' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Claimed</span>
          {issueFilter === 'claimed' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setIssueFilter('unclaimed')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueFilter === 'unclaimed' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Unclaimed</span>
          {issueFilter === 'unclaimed' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setIssueFilter('completed')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueFilter === 'completed' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Completed</span>
          {issueFilter === 'completed' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setIssueFilter('active')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueFilter === 'active' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Active</span>
          {issueFilter === 'active' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const SortMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="bg-white/40 cursor-pointer border-white/40 backdrop-blur-sm text-gray-800 hover:bg-white/50 hover:border-white/50 hover:text-gray-700"
        >
          <SortAsc className="mr-1 h-4 w-4 text-gray-600" />
          <span>Sort</span>
          {issueSort !== 'newest' && (
            <Badge className="ml-2 bg-gray-200 text-gray-800 border-white/30">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white/20 border-white/30 backdrop-blur-md text-gray-800">
        <DropdownMenuLabel className="text-gray-700">
          Sort Issues
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/30" />
        <DropdownMenuItem
          onClick={() => setIssueSort('newest')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueSort === 'newest' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Newest First</span>
          {issueSort === 'newest' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setIssueSort('oldest')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueSort === 'oldest' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Oldest First</span>
          {issueSort === 'oldest' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem>
        {/* <DropdownMenuItem
          onClick={() => setIssueSort('bounty-high')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueSort === 'bounty-high' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Bounty: High to Low</span>
          {issueSort === 'bounty-high' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem> */}
        {/* <DropdownMenuItem
          onClick={() => setIssueSort('bounty-low')}
          className={cn(
            'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
            issueSort === 'bounty-low' && 'bg-white/50 font-medium',
          )}
        >
          <span className="text-gray-800">Bounty: Low to High</span>
          {issueSort === 'bounty-low' && (
            <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
          )}
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const desktopView = (
    <div className="flex flex-col gap-6 md:flex-row h-[calc(100vh-105px)]">
      <div className="w-full shrink-0 rounded-3xl bg-white/30 backdrop-blur-md border border-white/30 p-3 sm:p-4 md:p-5 shadow-lg md:w-1/2 lg:w-5/12 flex flex-col">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/50 pb-2 shrink-0">
          <div className="flex items-center font-semibold text-2xl text-gray-800">
            <GitBranch
              className="mr-2 h-6 w-6"
              color="#4B5563"
            />
            Repositories
            <span className="ml-2 text-gray-700">
              ({filteredRepositories.length})
            </span>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
            <div className="relative w-full max-w-xs">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search repositories..."
                value={repoSearchTerm}
                onChange={(e) => setRepoSearchTerm(e.target.value)}
                className="bg-white/40 border-white/40 backdrop-blur-sm pl-8 text-gray-800 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 w-full"
              />
              {repoSearchTerm && (
                <button
                  type="button"
                  className="absolute top-2.5 right-2"
                  onClick={() => setRepoSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-600 hover:text-gray-500" />
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="bg-white/40 cursor-pointer border-white/40 backdrop-blur-sm text-gray-800 hover:bg-white/50 hover:border-white/50 hover:text-gray-700"
                >
                  <Filter className="mr-1 h-4 w-4 text-gray-600" />
                  <span>Tech</span>
                  {repoTechFilter && (
                    <Badge className="ml-2 bg-gray-200 text-gray-800 border-white/30">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/20 border-white/30 backdrop-blur-md text-gray-800 max-h-60 overflow-y-auto">
                <DropdownMenuLabel className="text-gray-700">
                  Filter by Tech
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/30" />
                <DropdownMenuItem
                  onClick={() => setRepoTechFilter(null)}
                  className={cn(
                    'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
                    !repoTechFilter && 'bg-white/50 font-medium',
                  )}
                >
                  <span className="text-gray-800">All</span>
                  {!repoTechFilter && (
                    <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
                  )}
                </DropdownMenuItem>
                {allRepoTechs.map((tech) => (
                  <DropdownMenuItem
                    key={tech}
                    onClick={() => setRepoTechFilter(tech)}
                    className={cn(
                      'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
                      repoTechFilter === tech && 'bg-white/50 font-medium',
                    )}
                  >
                    <span className="text-gray-800">{tech}</span>
                    {repoTechFilter === tech && (
                      <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent flex-1 min-h-0 overflow-y-auto rounded-lg p-1">
          <div className="space-y-3">
            {isLoadingRepos || isFetchingRepos ? (
              <LoadingRepos />
            ) : filteredRepositories.length > 0 ? (
              filteredRepositories.map((repo) => (
                <button
                  type="button"
                  key={repo.id}
                  onClick={() => handleRepoSelect(repo.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleRepoSelect(repo.id);
                    }
                  }}
                  aria-pressed={selectedRepoId === repo.id}
                  className="cursor-pointer rounded-lg w-full"
                >
                  <RepoCard {...repo} />
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <GitBranch className="mb-2 h-10 w-10 text-gray-600" />
                <p className="text-gray-600">No repositories found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full rounded-3xl bg-white/40 backdrop-blur-md border border-white/30 p-4 sm:p-5 shadow-lg md:w-1/2 lg:w-7/12 flex flex-col">
        <div className="mb-3 flex items-center justify-between border-b border-white/50 pb-2 shrink-0">
          <h2 className="flex items-center font-semibold text-2xl text-gray-800">
            <Code
              className="mr-2 h-6 w-6"
              color="#4B5563"
            />
            Issues
            {selectedRepo && (
              <span className="ml-2 text-lg text-gray-700 line-clamp-1">
                - {selectedRepo.name}
              </span>
            )}
          </h2>
          {selectedRepo && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={clearSelection}
              className="bg-white/40 cursor-pointer border-white/40 backdrop-blur-sm text-gray-800 hover:bg-white/50 hover:text-gray-600"
            >
              <XCircle className="mr-1 h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        {selectedRepo && (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg p-3 shrink-0">
            <div className="relative max-w-md grow">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/40 border-white/40 backdrop-blur-sm pl-8 text-gray-800 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute top-2.5 right-2"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-600 hover:text-gray-500" />
                </button>
              )}
            </div>

            <FilterMenu />
            <SortMenu />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={resetFilters}
                className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800 hover:text-gray-600"
              >
                <X className="mr-1 h-4 w-4" /> Reset
              </Button>
            )}
          </div>
        )}

        {selectedRepo && hasActiveFilters && (
          <div className="mb-4 flex flex-wrap gap-2 rounded-lg p-3 shrink-0">
            {issueFilter !== 'all' && (
              <Badge
                variant="outline"
                className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800"
              >
                <Filter className="mr-1 h-3 w-3" /> {filterBadgeText}
              </Badge>
            )}
            {issueSort !== 'newest' && (
              <Badge
                variant="outline"
                className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800"
              >
                <SortAsc className="mr-1 h-3 w-3" /> {sortBadgeText}
              </Badge>
            )}
            {searchTerm && (
              <Badge
                variant="outline"
                className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800"
              >
                <Search className="mr-1 h-3 w-3" /> "{searchTerm}"
              </Badge>
            )}
          </div>
        )}

        <div className="scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent flex-1 min-h-0 overflow-y-auto rounded-lg p-2">
          {selectedRepo ? (
            isLoadingIssues || isFetchingIssues ? (
              <LoadingIssues />
            ) : filteredIssues.length > 0 ? (
              <div className="space-y-4">
                {filteredIssues.map((issue: IssuesData) => (
                  <div
                    key={issue.id}
                    className="transform transition-all duration-200 hover:translate-y-[-2px]"
                  >
                    <IssueCard {...issue} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="mb-2 h-10 w-10 text-gray-600" />
                <p className="text-gray-600">No issues found</p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    type="button"
                    onClick={resetFilters}
                    className="mt-2 text-gray-700 hover:text-gray-500"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-white/30 border-dashed bg-white/10">
              <Code className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-gray-600 text-sm sm:text-base">
                Select a repository to view its issues
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const mobileView = (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        setActiveTab(value as 'repositories' | 'issues')
      }
      className="md:hidden"
    >
      <TabsList className="grid w-full grid-cols-2 bg-white/40 backdrop-blur-md p-1 border border-white/30 rounded-2xl">
        <TabsTrigger
          value="repositories"
          className={cn(
            'data-[state=active]:bg-white/40 data-[state=active]:text-gray-800 rounded-2xl',
            'data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-500',
          )}
        >
          <GitBranch className="mr-2 h-4 w-4" /> Repositories
        </TabsTrigger>
        <TabsTrigger
          value="issues"
          className={cn(
            'data-[state=active]:bg-white/40 data-[state=active]:text-gray-800 rounded-2xl',
            'data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-500',
          )}
        >
          <Code className="mr-2 h-4 w-4" /> Issues
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="repositories"
        className="mt-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 p-4 sm:p-5 shadow-lg"
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/50 pb-2 shrink-0">
          <div className="flex items-center font-semibold text-xl sm:text-2xl text-gray-800">
            <GitBranch className="mr-2 h-6 w-6 text-gray-600" />
            Repositories
            <span className="ml-2 text-gray-700">
              ({filteredRepositories.length})
            </span>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <div className="relative">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search repositories..."
                value={repoSearchTerm}
                onChange={(e) => setRepoSearchTerm(e.target.value)}
                className="bg-white/40 border-white/40 backdrop-blur-sm pl-8 text-gray-800 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                style={{ minWidth: 140 }}
              />
              {repoSearchTerm && (
                <button
                  type="button"
                  className="absolute top-2.5 right-2"
                  onClick={() => setRepoSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-600 hover:text-gray-500" />
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="bg-white/40 cursor-pointer border-white/40 backdrop-blur-sm text-gray-800 hover:bg-white/50 hover:border-white/50 hover:text-gray-700"
                >
                  <Filter className="mr-1 h-4 w-4 text-gray-600" />
                  <span>Tech</span>
                  {repoTechFilter && (
                    <Badge className="ml-2 bg-gray-200 text-gray-800 border-white/30">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/20 border-white/30 backdrop-blur-md text-gray-800 max-h-60 overflow-y-auto">
                <DropdownMenuLabel className="text-gray-700">
                  Filter by Tech
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/30" />
                <DropdownMenuItem
                  onClick={() => setRepoTechFilter(null)}
                  className={cn(
                    'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
                    !repoTechFilter && 'bg-white/50 font-medium',
                  )}
                >
                  <span className="text-gray-800">All</span>
                  {!repoTechFilter && (
                    <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
                  )}
                </DropdownMenuItem>
                {allRepoTechs.map((tech) => (
                  <DropdownMenuItem
                    key={tech}
                    onClick={() => setRepoTechFilter(tech)}
                    className={cn(
                      'cursor-pointer hover:bg-white/40 data-highlighted:bg-white/40',
                      repoTechFilter === tech && 'bg-white/50 font-medium',
                    )}
                  >
                    <span className="text-gray-800">{tech}</span>
                    {repoTechFilter === tech && (
                      <CheckSquare className="ml-2 h-4 w-4 text-gray-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent h-[70vh] overflow-y-auto rounded-lg p-2">
          <div className="space-y-3">
            {isLoadingRepos || isFetchingRepos ? (
              <LoadingRepos />
            ) : filteredRepositories.length > 0 ? (
              filteredRepositories.map((repo) => (
                <button
                  type="button"
                  key={repo.id}
                  onClick={() => handleRepoSelect(repo.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleRepoSelect(repo.id);
                    }
                  }}
                  aria-pressed={selectedRepoId === repo.id}
                  className={cn(
                    'cursor-pointer rounded-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md w-full',
                    selectedRepoId === repo.id
                      ? 'ring-2 ring-gray-500'
                      : 'hover:ring-1 hover:ring-gray-400',
                  )}
                >
                  <RepoCard {...repo} />
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <GitBranch className="mb-2 h-10 w-10 text-gray-600" />
                <p className="text-gray-600">No repositories found.</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent
        value="issues"
        className="mt-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 p-4 sm:p-5 shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between border-b border-white/50 pb-2">
          <h2 className="flex items-center font-semibold text-xl sm:text-2xl text-gray-800">
            <Code className="mr-2 h-6 w-6 text-gray-600" />
            {selectedRepo && (
              <span className="ml-2 text-lg text-gray-800">
                {selectedRepo.name}
              </span>
            )}
          </h2>
          {selectedRepo && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={clearSelection}
              className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800 hover:bg-white/50 hover:text-gray-600"
            >
              <XCircle className="mr-1 h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        {selectedRepo && (
          <div className="mb-4 space-y-3  rounded-lg p-3">
            <div className="relative">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/40 border-white/40 backdrop-blur-sm pl-8 text-gray-800 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute top-2.5 right-2"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-600 hover:text-gray-500" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterMenu />
              <SortMenu />
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={resetFilters}
                  className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800 hover:text-gray-600"
                >
                  <X className="mr-1 h-4 w-4" /> Reset
                </Button>
              )}
            </div>
          </div>
        )}

        {selectedRepo && hasActiveFilters && (
          <div className="mb-4 flex flex-wrap gap-2 rounded-lg p-3">
            {issueFilter !== 'all' && (
              <Badge
                variant="outline"
                className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800"
              >
                <Filter className="mr-1 h-3 w-3" /> {filterBadgeText}
              </Badge>
            )}
            {issueSort !== 'newest' && (
              <Badge
                variant="outline"
                className="bg-white/40 border-white/40 backdrop-blur-sm text-gray-800"
              >
                <SortAsc className="mr-1 h-3 w-3" /> {sortBadgeText}
              </Badge>
            )}
            {searchTerm && (
              <Badge
                variant="outline"
                className="max-w-xs truncate bg-white/40 border-white/40 backdrop-blur-sm text-gray-800"
              >
                <Search className="mr-1 h-3 w-3" /> "{searchTerm}"
              </Badge>
            )}
          </div>
        )}

        <div className="scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent h-[calc(70vh-150px)] overflow-y-auto rounded-lg p-2">
          {selectedRepo ? (
            isLoadingIssues || isFetchingIssues ? (
              <LoadingIssues />
            ) : filteredIssues.length > 0 ? (
              <div className="space-y-4">
                {filteredIssues.map((issue: IssuesData) => (
                  <div
                    key={issue.id}
                    className="transform transition-all duration-200 hover:translate-y-[-2px]"
                  >
                    <IssueCard {...issue} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="mb-2 h-10 w-10 text-gray-600" />
                <p className="text-gray-600">No issues found</p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    type="button"
                    onClick={resetFilters}
                    className="mt-2 text-gray-700 hover:text-gray-500"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-white/30 border-dashed bg-white/10">
              <Code className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-gray-600 text-sm sm:text-base">
                Select a repository to view its issues
              </p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <SunGlareEffect />
      <Cloud />

      <div className="z-20 h-[80px] shrink-0">
        <Navbar />
      </div>
      <div className="w-11/12 mx-auto flex flex-1 flex-col pt-4">
        <div className="hidden md:block md:flex-1 md:min-h-0">
          {desktopView}
        </div>
        <div className="md:hidden">{mobileView}</div>
      </div>
    </div>
  );
};

export default ReposPage;
